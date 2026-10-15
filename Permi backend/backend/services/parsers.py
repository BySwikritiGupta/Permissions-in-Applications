
import json
import xml.etree.ElementTree as ET


ANDROID_NS = "{http://schemas.android.com/apk/res/android}"


def normalize_permissions(permissions: list[str]) -> list[str]:
    """Clean permission names and remove duplicates."""

    cleaned = set()

    for permission in permissions:
        if not isinstance(permission, str):
            continue

        permission = permission.strip()

        prefix = "android.permission."
        if permission.startswith(prefix):
            permission = permission[len(prefix):]

        if permission:
            cleaned.add(permission)

    return sorted(cleaned)


def parse_json_report(raw: bytes) -> dict:
    """Read a JSON permission report."""

    try:
        data = json.loads(raw.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid JSON permission report.") from exc

    if not isinstance(data, dict):
        raise ValueError("JSON report must contain an object.")

    permissions = data.get("permissions")

    if not isinstance(permissions, list) or not permissions:
        raise ValueError(
            "Report must contain a non-empty permissions list."
        )

    if not all(isinstance(p, str) for p in permissions):
        raise ValueError("Every permission must be a string.")

    cleaned_permissions = normalize_permissions(permissions)

    if not cleaned_permissions:
        raise ValueError("No valid permissions were found.")

    return {
        "app_name": data.get("app_name", "Unknown Application"),
        "purpose": data.get("purpose", ""),
        "category": data.get("category", "general"),
        "package_name": data.get("package_name"),
        "permissions": cleaned_permissions,
    }


def parse_manifest_xml(raw: bytes) -> dict:
    """Extract declared permissions from Android manifest XML."""

    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        raise ValueError("Invalid Android manifest XML.") from exc

    if root.tag.split("}")[-1] != "manifest":
        raise ValueError("XML root must be an Android manifest.")

    permissions = []

    for element in root.iter():
        tag = element.tag.split("}")[-1]

        if tag in {
            "uses-permission",
            "uses-permission-sdk-23",
            "uses-permission-sdk-m",
            "uses-permission-sdk-28",
        }:
            permission = element.attrib.get(ANDROID_NS + "name")

            if permission:
                permissions.append(permission)

    cleaned_permissions = normalize_permissions(permissions)

    if not cleaned_permissions:
        raise ValueError("No declared permissions found in the manifest.")

    return {
        "app_name": "Android Application",
        "purpose": "",
        "category": "general",
        "package_name": root.attrib.get("package"),
        "permissions": cleaned_permissions,
    }
