from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
redirects_file = ROOT / "redirects.csv"

with redirects_file.open("r", encoding="utf-8", newline="") as f:
    rows = list(csv.DictReader(f))

mapping = {r["old_url"].strip(): r["target_url"].strip() for r in rows}
errors = []

for old_url, target_url in mapping.items():
    if old_url == target_url:
        errors.append(f"Self-redirect: {old_url}")
    if target_url in mapping:
        errors.append(f"Redirect chain detected: {old_url} -> {target_url} -> {mapping[target_url]}")

if errors:
    print("REDIRECT AUDIT FAILED")
    for err in errors:
        print(f"- {err}")
    raise SystemExit(1)

print("REDIRECT AUDIT PASSED")
