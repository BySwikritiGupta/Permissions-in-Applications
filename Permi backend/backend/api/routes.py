
import json
import uuid
from datetime import datetime, timezone
from services.apk_parser import parse_apk
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from database.db import get_connection
from schemas import AnalyzeReportRequest
from services.parsers import parse_json_report, parse_manifest_xml
from services.risk_engine import analyze_permissions


router = APIRouter()


# Save scan results in the SQLite database
def save_scan(result: dict) -> None:
    connection = get_connection()

    try:
        connection.execute(
            """
            INSERT INTO scans (
                scan_id, created_at, app_name, package_name,
                purpose, category, analysis_type, analysis_status,
                risk_score, risk_level, permissions_checked,
                permissions_found, findings, suspicious_combinations,
                summary, limitations
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                result["scan_id"],
                result["created_at"],
                result["app_name"],
                result.get("package_name"),
                result.get("purpose", ""),
                result.get("category", "general"),
                result["analysis_type"],
                result["analysis_status"],
                result["risk_score"],
                result["risk_level"],
                result["permissions_checked"],
                json.dumps(result["permissions_found"]),
                json.dumps(result["findings"]),
                json.dumps(result["suspicious_combinations"]),
                result["summary"],
                json.dumps(result["limitations"]),
            ),
        )
        connection.commit()
    finally:
        connection.close()


# Health check
@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "PermiShield API"
    }


# Analyze permissions submitted as JSON
@router.post("/scans/report")
def analyze_report(request: AnalyzeReportRequest):
    try:
        parsed = {
            "app_name": request.app_name,
            "purpose": request.purpose,
            "category": request.category,
            "package_name": request.package_name,
            "permissions": request.permissions,
        }

        # Validate and normalize permissions
        parsed = parse_json_report(
            json.dumps(parsed).encode("utf-8")
        )

        analysis = analyze_permissions(
            app_name=parsed["app_name"],
            purpose=parsed["purpose"],
            category=parsed["category"],
            permissions=parsed["permissions"],
        )

        result = {
            "scan_id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "app_name": parsed["app_name"],
            "package_name": parsed["package_name"],
            "purpose": parsed["purpose"],
            "category": parsed["category"],
            "analysis_type": "permission_report",
            "analysis_status": "completed",
            **analysis,
        }

        save_scan(result)
        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc


# Upload and analyze Android Manifest XML
@router.post("/scans")
async def upload_manifest(file: UploadFile = File(...), app_name: str | None = Form(None), category: str | None = Form(None), purpose: str | None = Form(None)):
    filename = file.filename or ""

    if not filename.lower().endswith(".xml"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an AndroidManifest.xml file."
        )

    try:
        raw = await file.read()

        if not raw:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty."
            )

        if len(raw) > 2 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="File size must be 2 MB or less."
            )

        parsed = parse_manifest_xml(raw)
        parsed["app_name"] = app_name or parsed["app_name"]
        parsed["category"] = category or parsed["category"]
        parsed["purpose"] = purpose or parsed["purpose"]

        analysis = analyze_permissions(
            app_name=parsed["app_name"],
            purpose=parsed["purpose"],
            category=parsed["category"],
            permissions=parsed["permissions"],
        )

        result = {
            "scan_id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "app_name": parsed["app_name"],
            "package_name": parsed["package_name"],
            "purpose": parsed["purpose"],
            "category": parsed["category"],
            "analysis_type": "android_manifest",
            "analysis_status": "completed",
            **analysis,
        }

        save_scan(result)
        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    finally:
        await file.close()


@router.post("/scans/report/file")
async def upload_json_report(
    file: UploadFile = File(...),
    app_name: str | None = Form(None),
    category: str | None = Form(None),
    purpose: str | None = Form(None),
):
    """Upload and analyze a JSON permission report."""
    filename = file.filename or ""
    if not filename.lower().endswith(".json"):
        raise HTTPException(status_code=400, detail="Please upload a .json report file.")

    try:
        raw = await file.read(2 * 1024 * 1024 + 1)
        if not raw:
            raise HTTPException(status_code=400, detail="The uploaded JSON file is empty.")
        if len(raw) > 2 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="JSON file size must be 2 MB or less.")

        try:
            payload = json.loads(raw.decode("utf-8-sig"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise HTTPException(status_code=400, detail="The uploaded file is not valid JSON.") from exc
        if not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="JSON report must contain an object.")

        payload["app_name"] = app_name or payload.get("app_name", "Unknown Application")
        payload["category"] = category or payload.get("category", "general")
        payload["purpose"] = purpose if purpose is not None else payload.get("purpose", "")
        parsed = parse_json_report(json.dumps(payload).encode("utf-8"))
        analysis = analyze_permissions(
            app_name=parsed["app_name"], purpose=parsed["purpose"],
            category=parsed["category"], permissions=parsed["permissions"],
        )
        result = {
            "scan_id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "app_name": parsed["app_name"],
            "package_name": parsed["package_name"],
            "purpose": parsed["purpose"],
            "category": parsed["category"],
            "analysis_type": "permission_report",
            "analysis_status": "completed",
            **analysis,
        }
        save_scan(result)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        await file.close()

# Get scan history
@router.get("/scans")
def get_scan_history():
    connection = get_connection()

    try:
        rows = connection.execute(
            """
            SELECT
                scan_id,
                created_at,
                app_name,
                package_name,
                analysis_type,
                analysis_status,
                risk_score,
                risk_level,
                permissions_checked
            FROM scans
            ORDER BY created_at DESC
            """
        ).fetchall()

        return {
            "total": len(rows),
            "scans": [dict(row) for row in rows]
        }

    finally:
        connection.close()

# Get one scan's complete report
@router.get("/scans/{scan_id}")
def get_scan_details(scan_id: str):
    connection = get_connection()

    try:
        row = connection.execute(
            "SELECT * FROM scans WHERE scan_id = ?",
            (scan_id,)
        ).fetchone()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Scan report not found."
            )

        result = dict(row)

        # Convert stored JSON strings back into Python data
        for field in (
            "permissions_found",
            "findings",
            "suspicious_combinations",
            "limitations",
        ):
            result[field] = json.loads(result[field])

        return result

    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail="Stored scan data is invalid."
        ) from exc

    finally:
        connection.close()

@router.post("/scans/apk")
async def upload_apk(
    file: UploadFile = File(...),
    app_name: str | None = Form(None),
    category: str | None = Form(None),
    purpose: str | None = Form(None),
):
    """Upload an Android APK and analyze its declared permissions."""

    # Validate the uploaded file name
    if not file.filename or not file.filename.lower().endswith(".apk"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an .apk file."
        )

    # Read and validate file size (maximum 100 MB)
    try:
        raw = await file.read(100 * 1024 * 1024 + 1)
        if not raw:
            raise HTTPException(status_code=400, detail="The uploaded APK file is empty.")
        if len(raw) > 100 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="APK file is too large. Maximum allowed size is 100 MB.")

        try:
            apk_data = parse_apk(raw)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        apk_data["app_name"] = app_name or apk_data["app_name"]
        apk_data["category"] = category or apk_data["category"]
        apk_data["purpose"] = purpose or apk_data["purpose"]
        result = analyze_permissions(
            app_name=apk_data["app_name"], purpose=apk_data["purpose"],
            category=apk_data["category"], permissions=apk_data["permissions"],
        )
        result.update({
            "scan_id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "app_name": apk_data["app_name"],
            "package_name": apk_data["package_name"],
            "purpose": apk_data["purpose"],
            "category": apk_data["category"],
            "analysis_type": "apk",
            "analysis_status": "completed",
            "permissions_checked": len(apk_data["permissions"]),
        })
        save_scan(result)
        return result
    finally:
        await file.close()

