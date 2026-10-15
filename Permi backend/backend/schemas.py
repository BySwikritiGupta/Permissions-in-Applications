
from typing import Literal
from pydantic import BaseModel, Field


class AnalyzeReportRequest(BaseModel):
    app_name: str = Field(
        default="Unknown Application",
        min_length=1,
        max_length=120
    )

    purpose: str = Field(
        min_length=0,
        max_length=500
    )

    category: str = Field(
        default="general",
        max_length=80
    )

    package_name: str | None = None

    permissions: list[str] = Field(
        min_length=1,
        max_length=500
    )


class Finding(BaseModel):
    id: str
    permission: str | None = None
    title: str
    severity: Literal["Low", "Medium", "High"]
    category: str
    reason: str
    evidence: str
    recommendation: str
    points: int = Field(ge=0, le=100)


class ScanResult(BaseModel):
    scan_id: str
    created_at: str
    app_name: str
    package_name: str | None = None
    purpose: str
    category: str

    analysis_type: Literal[
        "permission_report",
        "android_manifest",
        "apk"
    ]

    analysis_status: Literal["completed"] = "completed"

    risk_score: int = Field(ge=0, le=100)
    risk_level: Literal["Low", "Medium", "High"]

    permissions_checked: int
    permissions_found: list[str]
    findings: list[Finding]
    suspicious_combinations: list[dict]

    summary: str
    limitations: list[str]
