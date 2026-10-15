
from services.risk_engine import analyze_permissions


def run_test(name, permissions, expected_min, expected_level):
    result = analyze_permissions(
        app_name=name,
        purpose="",
        category="general",
        permissions=permissions,
    )

    score = result["risk_score"]
    level = result["risk_level"]

    passed = score >= expected_min and level == expected_level

    print(f"\nTest: {name}")
    print(f"Score: {score}/100")
    print(f"Risk level: {level}")
    print(f"Findings: {len(result['findings'])}")
    print(f"Combinations: {len(result['suspicious_combinations'])}")
    print("Result:", "PASS" if passed else "CHECK")

    return passed


tests = [
    ("No permissions", [], 0, "Low"),
    ("Calculator", ["VIBRATE"], 0, "Low"),
    ("Contact access", ["READ_CONTACTS"], 18, "Low"),
    ("Microphone and internet",
     ["RECORD_AUDIO", "INTERNET"], 26, "Low"),
    ("SMS and contacts",
    ["READ_SMS", "READ_CONTACTS", "INTERNET"], 61, "High"),
    ("Duplicate permission",
     ["READ_CONTACTS", "READ_CONTACTS"], 18, "Low"),
]

passed_count = 0

for test in tests:
    if run_test(*test):
        passed_count += 1

print(f"\nFinal result: {passed_count}/{len(tests)} tests passed.")
