from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

errors: list[str] = []

required_pages = [
    ROOT / "index.html",
    ROOT / "start" / "index.html",
    ROOT / "tools" / "index.html",
    ROOT / "proof" / "index.html",
    ROOT / "pricing" / "index.html",
    ROOT / "coaching" / "index.html",
    ROOT / "faq" / "index.html",
]

for page in required_pages:
    if not page.exists():
        errors.append(f"Missing required page: {page.relative_to(ROOT)}")

page_contracts = {
    ROOT / "tools" / "index.html": [
        "How the far-transfer",
        "programme works.",
        "Why most training does not transfer",
        "The coach sets the route",
        "Manual mode",
    ],
    ROOT / "proof" / "index.html": [
        "What we claim,",
        "what we measure, what is still being tested.",
        "What transfer means here",
        "What remains exploratory",
        "/docs/protocols/mft-m-zone-check.md",
    ],
    ROOT / "pricing" / "index.html": [
        "Trident G IQ Pro",
        "Student",
        "Coach-led in-app mode",
        "Add Live Coaching",
        "Which route is best for you?",
        "14-day software refund window",
        "No auto-renewal",
        "Coaching requires Trident G IQ Pro",
        "Click any screenshot to enlarge",
    ],
    ROOT / "coaching" / "index.html": [
        "All coaching requires Trident G IQ Pro",
        "Set-up Session",
        "Live Cohort",
        "1:1 Premium",
        "Optional review of baseline cognitive tests from the app",
        "Map personal training objectives and friction patterns",
        "Zone Pulse history and Psi-CBS trends",
        "Applied transfer review",
        "Are sessions recorded?",
    ],
}

for page, required_strings in page_contracts.items():
    if not page.exists():
        continue
    text = page.read_text(encoding="utf-8")
    for item in required_strings:
        if item not in text:
            errors.append(f"Missing required copy in {page.relative_to(ROOT)}: {item}")

pricing_text = (ROOT / "pricing" / "index.html").read_text(encoding="utf-8")
pricing_forbidden = [
    "proof-posture",
    "Design intent + proof posture",
    "Launch pass",
    "IQ Core",
]
for item in pricing_forbidden:
    if item in pricing_text:
        errors.append(f"Pricing page still contains stale copy/class: {item}")

if '<span>The app</span>' in pricing_text or '<div class="footer-col-title">The app</div>' in pricing_text:
    errors.append("Pricing page shell should label /tools/ as Programme, not The app")

coaching_text = (ROOT / "coaching" / "index.html").read_text(encoding="utf-8")
if '<span>The app</span>' in coaching_text or '<div class="footer-col-title">The app</div>' in coaching_text:
    errors.append("Coaching page shell should label /tools/ as Programme, not The app")

claims = json.loads((ROOT / "claims-ladder.json").read_text(encoding="utf-8"))
forbidden = claims.get("banned_verbs_sitewide", [])

# The Proof page intentionally lists disallowed phrases as boundaries. Scan other
# HTML surfaces for those exact claim terms.
claim_scan_exclusions = {
    ROOT / "proof" / "index.html",
}

for html in ROOT.rglob("*.html"):
    if html in claim_scan_exclusions:
        continue
    text = html.read_text(encoding="utf-8").lower()
    for word in forbidden:
        escaped = re.escape(word.lower()).replace(r"\ ", r"\s+")
        pattern = rf"\b{escaped}\b"
        if re.search(pattern, text):
            errors.append(f"Forbidden phrase '{word}' found in {html.relative_to(ROOT)}")

if errors:
    print("VALIDATION FAILED")
    for err in errors:
        print(f"- {err}")
    raise SystemExit(1)

print("VALIDATION PASSED")
