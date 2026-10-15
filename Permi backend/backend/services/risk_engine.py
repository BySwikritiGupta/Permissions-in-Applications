
# PermiShield: Permission Risk Analysis Engine
# Project-defined heuristics, not a certified security standard.

from services.parsers import normalize_permissions


# Individual permission risk rules.
SENSITIVE_PERMISSIONS = {
    "READ_CONTACTS": {
        "severity": "High",
        "points": 18,
        "title": "Contact access",
        "reason": "This permission can expose the user's contact list.",
    },
    "WRITE_CONTACTS": {
        "severity": "High",
        "points": 20,
        "title": "Contact modification",
        "reason": "This permission can allow changes to contact data.",
    },
    "RECORD_AUDIO": {
        "severity": "High",
        "points": 18,
        "title": "Microphone access",
        "reason": "This permission can expose conversations or ambient audio.",
    },
    "CAMERA": {
        "severity": "High",
        "points": 16,
        "title": "Camera access",
        "reason": "This permission can provide access to the camera.",
    },
    "READ_SMS": {
        "severity": "High",
        "points": 25,
        "title": "SMS access",
        "reason": "This permission can expose private text messages.",
    },
    "SEND_SMS": {
        "severity": "High",
        "points": 25,
        "title": "Send SMS",
        "reason": "This permission can allow the app to send text messages.",
    },
    "ACCESS_FINE_LOCATION": {
        "severity": "High",
        "points": 20,
        "title": "Precise location",
        "reason": "This permission can expose precise location information.",
    },
    "ACCESS_COARSE_LOCATION": {
        "severity": "Medium",
        "points": 10,
        "title": "Approximate location",
        "reason": "This permission can expose approximate location.",
    },
    "ACCESS_BACKGROUND_LOCATION": {
        "severity": "High",
        "points": 24,
        "title": "Background location",
        "reason": (
            "This permission can enable background location access, "
            "subject to Android restrictions."
        ),
    },
    "READ_CALL_LOG": {
        "severity": "High",
        "points": 22,
        "title": "Call history access",
        "reason": "This permission can expose call history and communication patterns.",
    },
    "READ_PHONE_STATE": {
        "severity": "Medium",
        "points": 12,
        "title": "Phone state access",
        "reason": "This permission can expose telephony or device information.",
    },
    "MANAGE_EXTERNAL_STORAGE": {
        "severity": "High",
        "points": 22,
        "title": "Broad storage access",
        "reason": "This permission can provide broad access to shared storage.",
    },
    "READ_MEDIA_IMAGES": {
        "severity": "Medium",
        "points": 10,
        "title": "Image access",
        "reason": "This permission can expose user images.",
    },
    "READ_MEDIA_VIDEO": {
        "severity": "Medium",
        "points": 10,
        "title": "Video access",
        "reason": "This permission can expose user videos.",
    },
    "BODY_SENSORS": {
        "severity": "High",
        "points": 16,
        "title": "Body sensor access",
        "reason": "Sensor data can reveal sensitive activity information.",
    },
    "SYSTEM_ALERT_WINDOW": {
        "severity": "High",
        "points": 18,
        "title": "Display over other apps",
        "reason": (
            "This special permission can allow windows to appear over "
            "other apps. It may be legitimate but deserves review."
        ),
    },
    "REQUEST_INSTALL_PACKAGES": {
        "severity": "High",
        "points": 20,
        "title": "Install other applications",
        "reason": (
            "This permission can allow an app to request installation "
            "of additional packages."
        ),
    },
    "QUERY_ALL_PACKAGES": {
        "severity": "Medium",
        "points": 12,
        "title": "Discover installed applications",
        "reason": (
            "This permission can reveal information about installed "
            "applications, subject to Android restrictions."
        ),
    },
    "READ_EXTERNAL_STORAGE": {
        "severity": "Medium",
        "points": 10,
        "title": "External storage access",
        "reason": "This permission can provide access to shared storage on applicable Android versions.",
    },
    "READ_CALENDAR": {
        "severity": "Medium",
        "points": 12,
        "title": "Calendar access",
        "reason": "This permission can expose the user's calendar events.",
    },
    "WRITE_CALENDAR": {
        "severity": "Medium",
        "points": 12,
        "title": "Calendar modification",
        "reason": "This permission can allow changes to calendar events.",
    },
}


# Illustrative purpose profiles.
# These are review signals, not definitive allowlists.
PURPOSE_PROFILES = {
    "document_scanner": {
        "INTERNET", "ACCESS_NETWORK_STATE", "CAMERA",
        "READ_EXTERNAL_STORAGE", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO",
        "POST_NOTIFICATIONS",
    },
    "camera": {
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "CAMERA",
        "RECORD_AUDIO",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "READ_MEDIA_IMAGES",
        "READ_MEDIA_VIDEO",
        "POST_NOTIFICATIONS",
    },
    "browser": {
        "INTERNET", "ACCESS_NETWORK_STATE", "CAMERA", "RECORD_AUDIO",
        "ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION",
        "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "POST_NOTIFICATIONS",
    },
    "social": {
        "INTERNET", "ACCESS_NETWORK_STATE", "CAMERA", "RECORD_AUDIO",
        "READ_CONTACTS", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO",
        "POST_NOTIFICATIONS",
    },
    "media_player": {
        "INTERNET", "ACCESS_NETWORK_STATE", "READ_EXTERNAL_STORAGE",
        "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "POST_NOTIFICATIONS",
    },
    "game": {
        "INTERNET", "ACCESS_NETWORK_STATE", "VIBRATE",
        "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "POST_NOTIFICATIONS",
    },
    "calculator": {
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "VIBRATE",
        "POST_NOTIFICATIONS",
    },
    "weather": {
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "POST_NOTIFICATIONS",
    },
    "messaging": {
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "READ_CONTACTS",
        "CAMERA",
        "RECORD_AUDIO",
        "READ_MEDIA_IMAGES",
        "READ_MEDIA_VIDEO",
        "POST_NOTIFICATIONS",
    },
    "maps": {
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "CAMERA",
        "POST_NOTIFICATIONS",
    },
    "fitness": {
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "BODY_SENSORS",
        "POST_NOTIFICATIONS",
    },
}


# Avoid matching broad words inside unrelated text.
PURPOSE_KEYWORDS = {
    "document_scanner": ("document scanner", "scan documents", "scan receipts", "scanner app"),
    "camera": ("camera", "photography", "photo", "video recorder", "video recording", "take photos", "take pictures"),
    "browser": ("browser", "web browsing", "web browser", "internet browser"),
    "social": ("social network", "social media", "social app"),
    "media_player": ("media player", "music player", "video player", "streaming app"),
    "game": ("game", "gaming"),
    "calculator": ("calculator", "calculation"),
    "weather": ("weather", "forecast"),
    "messaging": ("messaging", "chat", "messenger"),
    "maps": ("maps", "navigation", "mapping"),
    "fitness": ("fitness", "workout", "health tracker"),
}


# Permissions commonly used by each app profile.
# A profile match is not proof that the permission is safe.
def detect_purpose(
    purpose: str,
    category: str,
    app_name: str = "",
) -> str:
    """Infer a supported purpose from supplied metadata."""

    text = f"{purpose} {category} {app_name}".lower()

    for profile, keywords in PURPOSE_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            return profile

    return "general"


def get_risk_level(score: int) -> str:
    """Convert a numeric risk score into a risk level."""

    if score >= 60:
        return "High"
    if score >= 30:
        return "Medium"
    return "Low"


def analyze_permissions(
    app_name: str,
    purpose: str,
    category: str,
    permissions: list[str],
) -> dict:
    """
    Analyze declared Android permissions.

    Scores are project-defined heuristics and do not establish
    whether an application is malicious.
    """

    # Normalize and deduplicate for consistent scoring.
    normalized = normalize_permissions(permissions)
    permissions = list(dict.fromkeys(normalized))
    permission_set = set(permissions)

    purpose_profile = detect_purpose(
        purpose=purpose,
        category=category,
        app_name=app_name,
    )

    allowed_permissions = PURPOSE_PROFILES.get(
        purpose_profile, set()
    )

    findings = []
    combinations = []
    total_points = 0

    # Check individual sensitive permissions.
    for permission in permissions:
        rule = SENSITIVE_PERMISSIONS.get(permission)

        if rule is None:
            continue

        expected_for_purpose = permission in allowed_permissions
        points = 3 if expected_for_purpose else rule["points"]
        finding_category = "expected_permission" if expected_for_purpose else "sensitive_permission"
        reason = rule["reason"]
        if expected_for_purpose:
            reason = (
                f"{permission} is commonly used by a {purpose_profile} app. "
                "Its actual use should still match the feature and user expectation."
            )

        # Add a modest mismatch penalty for supported profiles.
        if (
            purpose_profile != "general"
            and not expected_for_purpose
        ):
            points += 12
            finding_category = "purpose_mismatch"
            reason += (
                f" Its necessity is unclear for a "
                f"{purpose_profile} application."
            )

        # Keep finding points and total score consistent.
        points = min(points, 35)
        total_points += points

        findings.append({
            "id": f"PERM-{permission}",
            "permission": permission,
            "title": rule["title"],
            "severity": "Low" if expected_for_purpose else rule["severity"],
            "category": finding_category,
            "necessary": expected_for_purpose,
            "reason": reason,
            "evidence": (
                f"{permission} was declared in the supplied "
                "permission report or Android manifest."
            ),
            "recommendation": (
                "Review the feature requiring this permission. "
                "Request only necessary access and prefer a "
                "less-privileged option when feasible."
            ),
            "points": points,
        })

    # Detect combinations that warrant additional review.
    combination_rules = [
        {
            "id": "COMBO-CONTACTS-NETWORK",
            "required": {"READ_CONTACTS", "INTERNET"},
            "severity": "Medium",
            "points": 8,
            "reason": (
                "Contacts and network permissions are both declared. "
                "This can be legitimate but deserves purpose review."
            ),
            "recommendation": (
                "Verify that contact data is transmitted only for "
                "a necessary, disclosed feature."
            ),
        },
        {
            "id": "COMBO-MIC-NETWORK",
            "required": {"RECORD_AUDIO", "INTERNET"},
            "severity": "Medium",
            "points": 8,
            "reason": (
                "Microphone and network permissions are both declared. "
                "This alone does not prove recording or transmission."
            ),
            "recommendation": (
                "Review microphone use, user consent and network behaviour."
            ),
        },
        {
            "id": "COMBO-BACKGROUND-LOCATION",
            "required": {
                "ACCESS_FINE_LOCATION",
                "ACCESS_BACKGROUND_LOCATION",
            },
            "severity": "High",
            "points": 12,
            "reason": (
                "Precise and background location permissions are both declared."
            ),
            "recommendation": (
                "Confirm that continuous location access is essential "
                "and consider foreground or approximate access."
            ),
        },
        {
            "id": "COMBO-SMS-CONTACTS",
            "required": {"READ_SMS", "READ_CONTACTS"},
            "severity": "High",
            "points": 10,
            "reason": (
                "SMS and contacts permissions are both declared, "
                "allowing access to multiple categories of personal data."
            ),
            "recommendation": (
                "Verify the app's core purpose and ensure these accesses "
                "are necessary and clearly disclosed."
            ),
        },
        {
            "id": "COMBO-CAMERA-MIC",
            "required": {"CAMERA", "RECORD_AUDIO"},
            "severity": "Medium",
            "points": 8,
            "reason": (
                "Camera and microphone permissions are both declared. "
                "This is common for communication apps but merits review "
                "when unrelated to the app's purpose."
            ),
            "recommendation": (
                "Check that camera and microphone access occurs only "
                "for user-requested features."
            ),
        },
    ]

    for rule in combination_rules:
        if (
            rule["required"].issubset(permission_set)
            and not rule["required"].issubset(allowed_permissions)
        ):
            combinations.append({
                "id": rule["id"],
                "permissions": sorted(rule["required"]),
                "severity": rule["severity"],
                "reason": rule["reason"],
                "recommendation": rule["recommendation"],
                "points": rule["points"],
            })

            total_points += rule["points"]

    # Score is capped at 100.
    score = min(total_points, 100)
    risk_level = get_risk_level(score)

    summary = (
        f"Analysis completed for {app_name}. "
        f"Found {len(findings)} permission finding(s) and "
        f"{len(combinations)} combination warning(s). "
        f"Risk score: {score}/100 ({risk_level})."
    )

    return {
        "risk_score": score,
        "risk_level": risk_level,
        "permissions_checked": len(permissions),
        "permissions_found": permissions,
        "findings": findings,
        "suspicious_combinations": combinations,
        "summary": summary,
        "limitations": [
            "Declared permissions do not prove runtime use or misuse.",
            "Purpose profiles are heuristic and may flag legitimate features.",
            "The score is a project-defined triage score, not a certified rating.",
            "Static permission analysis does not prove malicious behaviour.",
            "Android permission behaviour can vary by OS version and target SDK.",
        ],
    }

print("\n--- Purpose Mismatch Test ---")

result = analyze_permissions(
    app_name="Simple Calculator",
    purpose="Basic calculations",
    category="calculator",
    permissions=["RECORD_AUDIO", "INTERNET"],
)

print("Risk score:", result["risk_score"])
print("Risk level:", result["risk_level"])
print("Findings:")

for finding in result["findings"]:
    print(
        finding["permission"],
        "| Category:", finding["category"],
        "| Points:", finding["points"],
    )

# Automated purpose mismatch assertion
mismatch_result = analyze_permissions(
    app_name="Simple Calculator",
    purpose="Basic calculations",
    category="calculator",
    permissions=["RECORD_AUDIO", "INTERNET"],
)

assert mismatch_result["risk_score"] == 38
assert mismatch_result["risk_level"] == "Medium"
assert any(
    finding["permission"] == "RECORD_AUDIO"
    and finding["category"] == "purpose_mismatch"
    and finding["points"] == 30
    for finding in mismatch_result["findings"]
)

print("Purpose mismatch automated test: PASS")
