from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
FIXTURE_PATH = ROOT / "fixtures" / "scoring_parity.fixture.json"


def round4(value: float) -> float:
    return round(value + 1e-12, 4)


def main() -> int:
    fixture = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    status_score = fixture["status_score"]
    rows = fixture["rows"]
    expected = fixture["expected"]

    total_weight = sum(float(row["weight"]) for row in rows)
    weighted_sum = sum(float(row["weight"]) * float(status_score[row["status"]]) for row in rows)
    site_weighted_score = weighted_sum / total_weight if total_weight else 0.0
    remaining = 1.0 - site_weighted_score

    priorities = []
    for row in rows:
        weight = float(row["weight"])
        score = float(status_score[row["status"]])
        business_priority = float(row["business_priority"]) / 100.0
        opportunity_gap = weight * (1.0 - score)
        priority = opportunity_gap * business_priority
        priorities.append((row["issue_id"], priority))
    priorities.sort(key=lambda p: p[1], reverse=True)
    observed_order = [issue for issue, _ in priorities]

    pillar_totals: dict[str, tuple[float, float]] = {}
    for row in rows:
        pillar = row["pillar"]
        weight = float(row["weight"])
        score = float(status_score[row["status"]])
        num, den = pillar_totals.get(pillar, (0.0, 0.0))
        pillar_totals[pillar] = (num + (weight * score), den + weight)

    observed_pillars = {
        pillar: round4(num / den) if den else 0.0 for pillar, (num, den) in pillar_totals.items()
    }

    errors: list[str] = []
    if round4(total_weight) != round4(expected["total_weight"]):
        errors.append(f"total_weight mismatch: {round4(total_weight)} != {expected['total_weight']}")
    if round4(site_weighted_score) != round4(expected["site_weighted_score"]):
        errors.append(
            f"site_weighted_score mismatch: {round4(site_weighted_score)} != {expected['site_weighted_score']}"
        )
    if round4(remaining) != round4(expected["remaining_opportunity"]):
        errors.append(f"remaining_opportunity mismatch: {round4(remaining)} != {expected['remaining_opportunity']}")
    if observed_order != expected["issue_priority_order"]:
        errors.append(f"issue priority order mismatch: {observed_order} != {expected['issue_priority_order']}")

    for pillar, expected_val in expected["pillar_scores"].items():
        observed_val = observed_pillars.get(pillar)
        if observed_val is None:
            errors.append(f"missing pillar score: {pillar}")
            continue
        if round4(observed_val) != round4(expected_val):
            errors.append(f"pillar {pillar} mismatch: {observed_val} != {expected_val}")

    if errors:
        print("SCORING PARITY FAILED")
        for err in errors:
            print(f"- {err}")
        return 1

    print("SCORING PARITY PASSED")
    print(f"site_weighted_score={round4(site_weighted_score)}")
    print(f"remaining_opportunity={round4(remaining)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
