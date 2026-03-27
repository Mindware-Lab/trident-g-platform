from __future__ import annotations

import csv
import json
import shutil
import sys
import uuid
from pathlib import Path

from _common import CRM_AGENT_DIR, fail, ok, run_guard


TOOLS_DIR = CRM_AGENT_DIR / "tools"
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import export_phase0_brevo_bootstrap as phase0  # noqa: E402


STRIPE_PAYMENT_HEADERS = [
    "id",
    "Created date (UTC)",
    "Amount",
    "Amount Refunded",
    "Currency",
    "Captured",
    "Status",
    "Customer Email",
]

STRIPE_CUSTOMER_HEADERS = [
    "id",
    "Description",
    "Email",
    "Name",
    "Created (UTC)",
    "Card ID",
    "Total Spend",
    "Payment Count",
    "Refunded Volume",
    "Dispute Losses",
]

EJUNKIE_HEADERS = [
    "Payment Date (MST)",
    "Processed by E-j (MST)",
    "Transaction ID",
    "Payment Processor",
    "E-j Internal Txn ID",
    "Payment Status",
    "First Name",
    "Last Name",
    "Payer E-mail",
    "Currency",
    "Item Name",
    "Amount",
]


def _write_csv(path: Path, headers: list[str], rows: list[dict[str, str]], *, delimiter: str = ",") -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers, delimiter=delimiter)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def _write_lines(path: Path, lines: list[str]) -> None:
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def _stripe_payment(
    payment_id: str,
    created_at: str,
    amount: str,
    email: str,
    *,
    status: str = "Paid",
    captured: str = "true",
    refunded: str = "0.00",
) -> dict[str, str]:
    return {
        "id": payment_id,
        "Created date (UTC)": created_at,
        "Amount": amount,
        "Amount Refunded": refunded,
        "Currency": "usd",
        "Captured": captured,
        "Status": status,
        "Customer Email": email,
    }


def _legacy_order(
    purchase_date: str,
    txn_id: str,
    status: str,
    first_name: str,
    last_name: str,
    email: str,
    amount: str,
    item_name: str,
) -> dict[str, str]:
    return {
        "Payment Date (MST)": purchase_date,
        "Processed by E-j (MST)": purchase_date,
        "Transaction ID": txn_id,
        "Payment Processor": "PayPal",
        "E-j Internal Txn ID": f"internal-{txn_id}",
        "Payment Status": status,
        "First Name": first_name,
        "Last Name": last_name,
        "Payer E-mail": email,
        "Currency": "USD",
        "Item Name": item_name,
        "Amount": amount,
    }


def main() -> None:
    temp_parent = CRM_AGENT_DIR / "tests" / ".tmp_phase0_bootstrap"
    if temp_parent.exists():
        shutil.rmtree(temp_parent)
    temp_parent.mkdir(parents=True, exist_ok=True)
    root = temp_parent / f"run_{uuid.uuid4().hex}"
    root.mkdir(parents=True, exist_ok=True)
    try:
        out_dir = root / "out"

        stripe_payments = root / "unified_payments.csv"
        stripe_customers = root / "Stripe_customers.csv"
        ejunkie = root / "e-junkie-2026-03-23.txt"
        podia = root / "podia-2026-03-23.txt"
        substack = root / "substack-2026-03-23.txt"
        unsubscribe = root / "unsubscribe.csv"
        privacy = root / "privacy.csv"
        bounce = root / "bounce.csv"
        complaint = root / "complaint.csv"

        _write_csv(
            stripe_payments,
            STRIPE_PAYMENT_HEADERS,
            [
                _stripe_payment("pay-alpha-1", "2026-03-12 10:00:00", "29.99", "alpha@example.com"),
                _stripe_payment("pay-alpha-2", "2026-03-16 09:00:00", "29.99", "alpha@example.com"),
                _stripe_payment("pay-bravo", "2026-03-20 11:00:00", "400.00", "bravo@example.com"),
                _stripe_payment(
                    "pay-charlie-failed",
                    "2026-03-18 10:00:00",
                    "29.99",
                    "charlie@example.com",
                    status="Failed",
                    captured="false",
                ),
                _stripe_payment(
                    "pay-delta-refund",
                    "2026-03-18 12:00:00",
                    "29.99",
                    "delta@example.com",
                    status="Refunded",
                    refunded="29.99",
                ),
                _stripe_payment("pay-unsub", "2026-03-13 10:00:00", "29.99", "unsub@example.com"),
                _stripe_payment("pay-bounce", "2026-03-13 11:00:00", "29.99", "bounce@example.com"),
                _stripe_payment("pay-complaint", "2026-03-13 12:00:00", "29.99", "complaint@example.com"),
                _stripe_payment("pay-privacy", "2026-03-13 13:00:00", "29.99", "privacy@example.com"),
                _stripe_payment("pay-echo", "2026-02-01 08:00:00", "50.00", "echo@example.com"),
            ],
        )

        _write_csv(
            stripe_customers,
            STRIPE_CUSTOMER_HEADERS,
            [
                {
                    "id": "cus-alpha",
                    "Description": "",
                    "Email": "alpha@example.com",
                    "Name": "Alpha Prime",
                    "Created (UTC)": "2026-03-12 09:55",
                    "Card ID": "",
                    "Total Spend": "59.98",
                    "Payment Count": "2",
                    "Refunded Volume": "0.00",
                    "Dispute Losses": "0.00",
                },
                {
                    "id": "cus-bravo",
                    "Description": "",
                    "Email": "bravo@example.com",
                    "Name": "Bravo Buyer",
                    "Created (UTC)": "2026-03-20 10:55",
                    "Card ID": "",
                    "Total Spend": "400.00",
                    "Payment Count": "1",
                    "Refunded Volume": "0.00",
                    "Dispute Losses": "0.00",
                },
                {
                    "id": "cus-rollup-only",
                    "Description": "",
                    "Email": "rollup@example.com",
                    "Name": "Rollup Only",
                    "Created (UTC)": "2026-03-02 08:00",
                    "Card ID": "",
                    "Total Spend": "99.00",
                    "Payment Count": "2",
                    "Refunded Volume": "0.00",
                    "Dispute Losses": "0.00",
                },
            ],
        )

        _write_csv(
            ejunkie,
            EJUNKIE_HEADERS,
            [
                _legacy_order(
                    "2026-03-01 09:00:00",
                    "ej-alpha",
                    "Completed",
                    "Alpha",
                    "Legacy",
                    "alpha@example.com",
                    "10.00",
                    "Legacy Alpha Product",
                ),
                _legacy_order(
                    "2026-02-10 08:00:00",
                    "ej-sam1",
                    "Completed",
                    "Sam",
                    "Same",
                    "sam1@example.com",
                    "40.00",
                    "Legacy Sam One",
                ),
            ],
            delimiter="\t",
        )

        _write_csv(
            podia,
            EJUNKIE_HEADERS,
            [
                _legacy_order(
                    "2026-02-11 08:00:00",
                    "pod-sam2",
                    "Completed",
                    "Sam",
                    "Same",
                    "sam2@example.com",
                    "60.00",
                    "Podia Sam Two",
                ),
                _legacy_order(
                    "2026-03-05 07:00:00",
                    "pod-foxtrot",
                    "Completed",
                    "Foxtrot",
                    "Buyer",
                    "foxtrot@example.com",
                    "35.00",
                    "Podia Foxtrot",
                ),
            ],
            delimiter="\t",
        )

        _write_csv(
            substack,
            EJUNKIE_HEADERS,
            [
                _legacy_order(
                    "2026-02-15 06:00:00",
                    "sub-golf",
                    "Completed",
                    "Golf",
                    "Buyer",
                    "golf@example.com",
                    "80.00",
                    "Substack Golf",
                ),
                _legacy_order(
                    "2026-03-01 10:00:00",
                    "sub-alpha",
                    "Completed",
                    "Alpha",
                    "Subscriber",
                    "alpha@example.com",
                    "5.00",
                    "Substack Alpha",
                ),
            ],
            delimiter="\t",
        )

        _write_lines(unsubscribe, ["unsub@example.com"])
        _write_csv(privacy, ["email", "request_type"], [{"email": "privacy@example.com", "request_type": "erase"}])
        _write_csv(bounce, ["email"], [{"email": "bounce@example.com"}])
        _write_lines(complaint, ["complaint@example.com"])

        phase0.main(
            [
                "--stripe-payments",
                str(stripe_payments),
                "--stripe-customers",
                str(stripe_customers),
                "--ejunkie",
                str(ejunkie),
                "--podia",
                str(podia),
                "--substack",
                str(substack),
                "--unsubscribe-csv",
                str(unsubscribe),
                "--privacy-request-csv",
                str(privacy),
                "--bounce-csv",
                str(bounce),
                "--complaint-csv",
                str(complaint),
                "--out-dir",
                str(out_dir),
                "--top-limit",
                "2",
                "--reserve-limit",
                "2",
                "--as-of",
                "2026-03-27T00:00:00Z",
            ]
        )

        qa = json.loads((out_dir / "qa_summary.json").read_text(encoding="utf-8"))
        if qa["summary"]["eligible_paid_count"] != 7:
            fail(f"expected 7 eligible_paid contacts, got {qa['summary']['eligible_paid_count']}")
        if qa["summary"]["suppressed_count"] != 4:
            fail(f"expected 4 suppressed contacts, got {qa['summary']['suppressed_count']}")
        if qa["summary"]["review_or_transactional_count"] != 3:
            fail(
                "expected 3 review/transactional contacts, "
                f"got {qa['summary']['review_or_transactional_count']}"
            )
        if qa["summary"]["eligible_shortfall"] != 0:
            fail(f"expected no shortfall for top-limit=2, got {qa['summary']['eligible_shortfall']}")

        mismatches = [
            item
            for item in qa["files"]
            if item["logical_source"] in {"podia", "substack"} and item["mismatched_label"]
        ]
        if len(mismatches) != 2:
            fail("expected mismatched-label warnings for podia and substack inputs")

        universe_rows = _read_csv(out_dir / "customer_universe.csv")
        universe = {row["email"]: row for row in universe_rows}
        for required_email in ("sam1@example.com", "sam2@example.com"):
            if required_email not in universe:
                fail(f"expected deduped universe to contain {required_email}")

        if universe["sam1@example.com"]["source_overlap"] != "ejunkie_only":
            fail("expected sam1@example.com to remain ejunkie_only")
        if universe["sam2@example.com"]["source_overlap"] != "podia_only":
            fail("expected sam2@example.com to remain podia_only despite parser mismatch")
        if universe["alpha@example.com"]["source_overlap"] != "ejunkie_plus_stripe_plus_substack":
            fail("expected alpha@example.com to keep multi-source attribution")
        if universe["echo@example.com"]["lapsed_paid_flag"] != "true":
            fail("expected echo@example.com to be marked lapsed_paid")
        if universe["alpha@example.com"]["primary_recommended_action"] != "launch_promo_followup":
            fail("expected alpha@example.com primary action to be launch_promo_followup")
        if universe["bravo@example.com"]["primary_recommended_action"] != "post_launch_onboarding":
            fail("expected bravo@example.com primary action to be post_launch_onboarding")
        if universe["echo@example.com"]["primary_recommended_action"] != "win_back_lapsed_paid":
            fail("expected echo@example.com primary action to be win_back_lapsed_paid")
        if universe["rollup@example.com"]["primary_recommended_action"] != "manual_review_required":
            fail("expected rollup@example.com primary action to be manual_review_required")

        top_rows = _read_csv(out_dir / "brevo_bootstrap_top_4500.csv")
        reserve_rows = _read_csv(out_dir / "brevo_bootstrap_reserve_next_500.csv")
        if [row["email"] for row in top_rows] != ["bravo@example.com", "alpha@example.com"]:
            fail(f"unexpected top export ordering: {[row['email'] for row in top_rows]}")
        if [row["email"] for row in reserve_rows] != ["golf@example.com", "sam2@example.com"]:
            fail(f"unexpected reserve export ordering: {[row['email'] for row in reserve_rows]}")

        action_rows = {row["email"]: row for row in _read_csv(out_dir / "contact_action_recommendations.csv")}
        if action_rows["alpha@example.com"]["bootstrap_bucket"] != "top_4500":
            fail("expected alpha@example.com bootstrap bucket to be top_4500")
        if action_rows["sam2@example.com"]["bootstrap_bucket"] != "reserve_next_500":
            fail("expected sam2@example.com bootstrap bucket to be reserve_next_500")
        if action_rows["unsub@example.com"]["primary_recommended_action"] != "suppress_do_not_contact":
            fail("expected unsub@example.com to be a suppression action")

        playbook_rows = _read_csv(out_dir / "segment_action_playbook.csv")
        if not any(row["match_key"] == "launch_promo_buyers" for row in playbook_rows):
            fail("expected segment_action_playbook.csv to include launch_promo_buyers")

        suppressed_rows = {row["email"]: row for row in _read_csv(out_dir / "suppressed_contacts.csv")}
        for suppressed_email, state in {
            "unsub@example.com": "suppressed_unsubscribed",
            "privacy@example.com": "suppressed_privacy_request",
            "bounce@example.com": "suppressed_bounced",
            "complaint@example.com": "suppressed_complaint",
        }.items():
            row = suppressed_rows.get(suppressed_email)
            if row is None or row["marketing_eligibility"] != state:
                fail(f"expected {suppressed_email} to be suppressed as {state}")

        review_rows = {row["email"]: row for row in _read_csv(out_dir / "review_required_contacts.csv")}
        for review_email in ("charlie@example.com", "delta@example.com", "rollup@example.com"):
            if review_email not in review_rows:
                fail(f"expected {review_email} in review_required_contacts.csv")

        if qa["counts"]["segments"].get("post_launch_stripe_buyers") != 2:
            fail("expected two post_launch_stripe_buyers in qa summary")
        if qa["counts"]["segments"].get("launch_promo_buyers") != 1:
            fail("expected one launch_promo_buyer in qa summary")
        if qa["counts"]["actions"].get("suppress_do_not_contact") != 4:
            fail("expected four suppress_do_not_contact actions in qa summary")

        ok("phase0 Brevo bootstrap export validated (ranking, suppression, source attribution, actions)")
    finally:
        shutil.rmtree(temp_parent, ignore_errors=True)


if __name__ == "__main__":
    run_guard(main)
