from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

required_pages = [
    ROOT / "index.html",
    ROOT / "start" / "index.html",
    ROOT / "tools" / "index.html",
    ROOT / "tools" / "g-tracker" / "index.html",
    ROOT / "tools" / "zone-coach" / "index.html",
    ROOT / "tools" / "capacity-gym" / "index.html",
    ROOT / "tools" / "mindware-gym" / "index.html",
]

errors: list[str] = []

mandatory_strings = [
    "Designed to train general intelligence capacity and cognitive resilience, and to test whether gains carry over under changed conditions.",
    "Wrapper swaps, boundary/trap probes, and delayed re-checks.",
    "Protocol + progression logic are public; users can export their training trail; we publish aggregated summaries of test results as the evidence base grows.",
    "Skills training and self-regulation, not diagnosis or treatment. Outcomes vary.",
]

for page in required_pages:
    text = page.read_text(encoding="utf-8")
    for item in mandatory_strings:
        if item not in text:
            errors.append(
                f"Missing mandatory copy in {page.relative_to(ROOT)}: {item[:52]}..."
            )
    if "/proof#protocols" not in text or "/proof#data" not in text:
        errors.append(f"Missing one-click transparency links in {page.relative_to(ROOT)}")

pricing_text = (ROOT / "pricing" / "index.html").read_text(encoding="utf-8")
if '<details class="proof-posture proof-posture-collapsed">' not in pricing_text:
    errors.append("Pricing page missing collapsed proof posture block")

claims = json.loads((ROOT / "claims-ladder.json").read_text(encoding="utf-8"))
forbidden = claims.get("banned_verbs_sitewide", [])

all_html = list(ROOT.rglob("*.html"))
for html in all_html:
    text = html.read_text(encoding="utf-8").lower()
    for word in forbidden:
        escaped = re.escape(word.lower()).replace(r"\ ", r"\s+")
        pattern = rf"\b{escaped}\b"
        if re.search(pattern, text):
            errors.append(f"Forbidden phrase '{word}' found in {html.relative_to(ROOT)}")

outcome_words = ["improves", "increases", "boosts"]
for html in all_html:
    text = html.read_text(encoding="utf-8").lower()
    for term in outcome_words:
        if term in text and "/proof#data" not in text:
            errors.append(
                f"Outcome term '{term}' in {html.relative_to(ROOT)} without /proof#data link"
            )

if errors:
    print("VALIDATION FAILED")
    for err in errors:
        print(f"- {err}")
    raise SystemExit(1)

print("VALIDATION PASSED")
