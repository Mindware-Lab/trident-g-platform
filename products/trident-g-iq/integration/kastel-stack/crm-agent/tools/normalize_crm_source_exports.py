from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple


SOURCE_SUBSTACK = "substack"
SOURCE_PODIA = "podia"
SOURCE_EJUNKIE = "ejunkie"
SOURCE_STRIPE = "stripe"
SOURCE_UNKNOWN = "unknown"

SUPPORTED_SOURCES = (SOURCE_SUBSTACK, SOURCE_PODIA, SOURCE_EJUNKIE, SOURCE_STRIPE)

TEMPLATE_HEADERS: Dict[str, List[str]] = {
    SOURCE_SUBSTACK: [
        "email",
        "first_name",
        "last_name",
        "subscriber_state",
        "subscription_tier",
        "subscribed_at",
        "last_open_at",
        "last_click_at",
    ],
    SOURCE_PODIA: [
        "email",
        "first_name",
        "last_name",
        "customer_id",
        "product_title",
        "enrolled_at",
        "last_activity_at",
        "purchase_amount",
        "currency",
    ],
    SOURCE_EJUNKIE: [
        "email",
        "first_name",
        "last_name",
        "order_id",
        "product_name",
        "purchase_date",
        "gross_amount",
        "currency",
        "payment_status",
    ],
    SOURCE_STRIPE: [
        "email",
        "first_name",
        "last_name",
        "stripe_customer_id",
        "created_at",
        "total_spend",
        "payment_count",
        "refunded_volume",
        "dispute_losses",
        "net_spend",
        "currency",
    ],
}


EJUNKIE_SIGNATURE_HEADERS = {
    "payment date (mst)",
    "processed by e-j (mst)",
    "transaction id",
    "e-j internal txn id",
    "payment status",
    "payer e-mail",
    "item name",
    "amount",
}

STRIPE_SIGNATURE_HEADERS = {
    "id",
    "email",
    "name",
    "created (utc)",
    "total spend",
    "payment count",
    "refunded volume",
    "dispute losses",
}

SUBSTACK_SIGNATURE_HEADERS = set(TEMPLATE_HEADERS[SOURCE_SUBSTACK])
PODIA_SIGNATURE_HEADERS = set(TEMPLATE_HEADERS[SOURCE_PODIA])
SUBSTACK_UI_SIGNATURE_HEADERS = {"subscriber", "type", "activity", "start date"}

FIELD_ALIASES: Dict[str, Dict[str, List[str]]] = {
    SOURCE_SUBSTACK: {
        "email": ["email", "subscriber", "subscriber email"],
        "first_name": ["first_name", "first name"],
        "last_name": ["last_name", "last name"],
        "subscriber_state": ["subscriber_state", "status", "state"],
        "subscription_tier": ["subscription_tier", "type"],
        "subscribed_at": ["subscribed_at", "start date", "start_date"],
        "last_open_at": ["last_open_at"],
        "last_click_at": ["last_click_at"],
    },
    SOURCE_PODIA: {
        "email": ["email"],
        "first_name": ["first_name", "first name"],
        "last_name": ["last_name", "last name"],
        "customer_id": ["customer_id"],
        "product_title": ["product_title", "item name"],
        "enrolled_at": ["enrolled_at"],
        "last_activity_at": ["last_activity_at"],
        "purchase_amount": ["purchase_amount", "amount", "gross_amount"],
        "currency": ["currency"],
    },
    SOURCE_EJUNKIE: {
        "email": ["payer e-mail", "email"],
        "first_name": ["first name", "first_name"],
        "last_name": ["last name", "last_name"],
        "order_id": ["transaction id", "e-j internal txn id", "order_id"],
        "product_name": ["item name", "product_name"],
        "purchase_date": ["payment date (mst)", "purchase_date"],
        "gross_amount": ["amount", "gross_amount"],
        "currency": ["currency"],
        "payment_status": ["payment status", "payment_status"],
    },
    SOURCE_STRIPE: {
        "stripe_customer_id": ["id", "customer id", "customer_id"],
        "email": ["email", "customer email", "payer e-mail"],
        "name": ["name", "customer name"],
        "created_at": ["created (utc)", "created_at", "created"],
        "total_spend": ["total spend", "total_spend", "lifetime value"],
        "payment_count": ["payment count", "payment_count"],
        "refunded_volume": ["refunded volume", "refunded_volume", "refund total"],
        "dispute_losses": ["dispute losses", "dispute_losses"],
        "currency": ["currency"],
    },
}

CRITICAL_OUTPUT_FIELDS: Dict[str, List[str]] = {
    SOURCE_SUBSTACK: ["email"],
    SOURCE_PODIA: ["email", "customer_id"],
    SOURCE_EJUNKIE: ["email", "order_id"],
    SOURCE_STRIPE: ["email", "stripe_customer_id"],
}


@dataclass
class FileAnalysis:
    input_path: str
    expected_source_from_filename: str
    detected_source_from_header: str
    header_count: int
    row_count: int
    delimiter: str
    mismatched_label: bool
    duplicate_headers: List[str]
    missing_required_for_detected: List[str]
    output_path: Optional[str]
    warnings: List[str]


def _canonical_key(name: str) -> str:
    return name.strip().lower()


def _dedupe_headers(headers: Sequence[str]) -> Tuple[List[str], List[str]]:
    seen: Dict[str, int] = {}
    deduped: List[str] = []
    duplicates: List[str] = []
    for raw in headers:
        base = raw.strip()
        count = seen.get(base, 0) + 1
        seen[base] = count
        if count > 1:
            duplicates.append(base)
            deduped.append(f"{base}__{count}")
        else:
            deduped.append(base)
    return deduped, sorted(set(duplicates))


def _guess_delimiter(first_line: str) -> str:
    if first_line.count("\t") > first_line.count(","):
        return "\t"
    return ","


def _expected_from_filename(path: Path) -> str:
    stem = path.stem.lower()
    if stem.startswith("substack"):
        return SOURCE_SUBSTACK
    if stem.startswith("podia"):
        return SOURCE_PODIA
    if stem.startswith("e-junkie") or stem.startswith("ejunkie") or stem.startswith(
        "e_junkie"
    ):
        return SOURCE_EJUNKIE
    if stem.startswith("stripe"):
        return SOURCE_STRIPE
    return SOURCE_UNKNOWN


def _read_rows(path: Path) -> Tuple[List[str], List[Dict[str, str]], str, List[str]]:
    text = path.read_text(encoding="utf-8-sig", errors="replace")
    lines = text.splitlines()
    if not lines:
        return [], [], ",", []
    delimiter = _guess_delimiter(lines[0])
    reader = csv.reader(lines, delimiter=delimiter)
    raw_headers = next(reader, [])
    headers, duplicates = _dedupe_headers(raw_headers)
    rows: List[Dict[str, str]] = []
    for record in reader:
        row: Dict[str, str] = {}
        for idx, header in enumerate(headers):
            value = record[idx].strip() if idx < len(record) else ""
            row[header] = value
        rows.append(row)
    return headers, rows, delimiter, duplicates


def _normalized_row_lookup(row: Dict[str, str]) -> Dict[str, str]:
    lookup: Dict[str, str] = {}
    for key, value in row.items():
        base = key.split("__", 1)[0]
        canonical = _canonical_key(base)
        if canonical not in lookup:
            lookup[canonical] = value
    return lookup


def _first_value(lookup: Dict[str, str], candidates: Sequence[str]) -> str:
    for candidate in candidates:
        key = _canonical_key(candidate)
        if key in lookup and lookup[key] != "":
            return lookup[key]
    return ""


def _extract_email(text: str) -> str:
    if "@" in text and " " not in text:
        return text.strip().lower()
    match = re.search(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}", text)
    if match:
        return match.group(0).strip().lower()
    return text.strip().lower()


def _split_name(full_name: str) -> Tuple[str, str]:
    raw = full_name.strip()
    if not raw:
        return "", ""
    parts = [part for part in raw.split() if part]
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def _to_float(value: str) -> float:
    cleaned = value.strip().replace(",", "")
    if not cleaned:
        return 0.0
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def detect_source(headers: Sequence[str]) -> str:
    canonical = {_canonical_key(h.split("__", 1)[0]) for h in headers}

    substack_score = len(canonical.intersection(SUBSTACK_SIGNATURE_HEADERS))
    substack_ui_score = len(canonical.intersection(SUBSTACK_UI_SIGNATURE_HEADERS))
    podia_score = len(canonical.intersection(PODIA_SIGNATURE_HEADERS))
    ejunkie_score = len(canonical.intersection(EJUNKIE_SIGNATURE_HEADERS))
    stripe_score = len(canonical.intersection(STRIPE_SIGNATURE_HEADERS))

    scores = {
        SOURCE_SUBSTACK: substack_score + substack_ui_score,
        SOURCE_PODIA: podia_score,
        SOURCE_EJUNKIE: ejunkie_score,
        SOURCE_STRIPE: stripe_score,
    }
    best_source = max(scores, key=scores.get)
    best_score = scores[best_source]

    if best_score == 0:
        return SOURCE_UNKNOWN

    # e-junkie should win only if strong signature exists.
    if best_source == SOURCE_EJUNKIE and ejunkie_score >= 4:
        return SOURCE_EJUNKIE
    if best_source == SOURCE_STRIPE and stripe_score >= 4:
        return SOURCE_STRIPE
    if best_source == SOURCE_SUBSTACK and (substack_score >= 4 or substack_ui_score >= 3):
        return SOURCE_SUBSTACK
    if best_source == SOURCE_PODIA and podia_score >= 4:
        return SOURCE_PODIA
    return SOURCE_UNKNOWN


def normalize_rows(source: str, rows: Sequence[Dict[str, str]]) -> List[Dict[str, str]]:
    normalized: List[Dict[str, str]] = []

    for row in rows:
        lookup = _normalized_row_lookup(row)

        if source == SOURCE_EJUNKIE:
            order_id = _first_value(
                lookup, FIELD_ALIASES[SOURCE_EJUNKIE]["order_id"]
            )
            record = {
                "email": _first_value(lookup, FIELD_ALIASES[SOURCE_EJUNKIE]["email"]),
                "first_name": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_EJUNKIE]["first_name"]
                ),
                "last_name": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_EJUNKIE]["last_name"]
                ),
                "order_id": order_id,
                "product_name": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_EJUNKIE]["product_name"]
                ),
                "purchase_date": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_EJUNKIE]["purchase_date"]
                ),
                "gross_amount": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_EJUNKIE]["gross_amount"]
                ),
                "currency": _first_value(lookup, FIELD_ALIASES[SOURCE_EJUNKIE]["currency"]),
                "payment_status": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_EJUNKIE]["payment_status"]
                ),
            }
        elif source == SOURCE_SUBSTACK:
            raw_email = _first_value(lookup, FIELD_ALIASES[SOURCE_SUBSTACK]["email"])
            record = {
                "email": _extract_email(raw_email),
                "first_name": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_SUBSTACK]["first_name"]
                ),
                "last_name": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_SUBSTACK]["last_name"]
                ),
                "subscriber_state": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_SUBSTACK]["subscriber_state"]
                )
                or "active",
                "subscription_tier": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_SUBSTACK]["subscription_tier"]
                ),
                "subscribed_at": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_SUBSTACK]["subscribed_at"]
                ),
                "last_open_at": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_SUBSTACK]["last_open_at"]
                ),
                "last_click_at": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_SUBSTACK]["last_click_at"]
                ),
            }
        elif source == SOURCE_PODIA:
            record = {
                "email": _first_value(lookup, FIELD_ALIASES[SOURCE_PODIA]["email"]),
                "first_name": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_PODIA]["first_name"]
                ),
                "last_name": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_PODIA]["last_name"]
                ),
                "customer_id": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_PODIA]["customer_id"]
                ),
                "product_title": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_PODIA]["product_title"]
                ),
                "enrolled_at": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_PODIA]["enrolled_at"]
                ),
                "last_activity_at": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_PODIA]["last_activity_at"]
                ),
                "purchase_amount": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_PODIA]["purchase_amount"]
                ),
                "currency": _first_value(lookup, FIELD_ALIASES[SOURCE_PODIA]["currency"]),
            }
        elif source == SOURCE_STRIPE:
            full_name = _first_value(lookup, FIELD_ALIASES[SOURCE_STRIPE]["name"])
            first_name, last_name = _split_name(full_name)
            total_spend = _to_float(
                _first_value(lookup, FIELD_ALIASES[SOURCE_STRIPE]["total_spend"])
            )
            refunded_volume = _to_float(
                _first_value(lookup, FIELD_ALIASES[SOURCE_STRIPE]["refunded_volume"])
            )
            dispute_losses = _to_float(
                _first_value(lookup, FIELD_ALIASES[SOURCE_STRIPE]["dispute_losses"])
            )
            net_spend = total_spend - refunded_volume - dispute_losses
            record = {
                "email": _extract_email(
                    _first_value(lookup, FIELD_ALIASES[SOURCE_STRIPE]["email"])
                ),
                "first_name": first_name,
                "last_name": last_name,
                "stripe_customer_id": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_STRIPE]["stripe_customer_id"]
                ),
                "created_at": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_STRIPE]["created_at"]
                ),
                "total_spend": f"{total_spend:.2f}",
                "payment_count": _first_value(
                    lookup, FIELD_ALIASES[SOURCE_STRIPE]["payment_count"]
                ),
                "refunded_volume": f"{refunded_volume:.2f}",
                "dispute_losses": f"{dispute_losses:.2f}",
                "net_spend": f"{net_spend:.2f}",
                "currency": _first_value(lookup, FIELD_ALIASES[SOURCE_STRIPE]["currency"])
                or "USD",
            }
        else:
            # Unknown source: keep row empty to force operator review.
            record = {}

        normalized.append(record)

    return normalized


def _required_missing(
    source: str, rows: Sequence[Dict[str, str]], headers: Sequence[str]
) -> List[str]:
    if source not in FIELD_ALIASES:
        return []
    if not rows:
        return CRITICAL_OUTPUT_FIELDS.get(source, [])

    lookup = _normalized_row_lookup(rows[0])
    missing: List[str] = []
    for field in CRITICAL_OUTPUT_FIELDS.get(source, []):
        candidates = FIELD_ALIASES[source].get(field, [field])
        value = _first_value(lookup, candidates)
        if not value:
            missing.append(field)
    return missing


def _write_csv(path: Path, headers: Sequence[str], rows: Sequence[Dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(headers), extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def analyze_and_normalize_file(
    input_path: Path,
    output_dir: Path,
    dry_run: bool,
    strict_source: bool,
) -> FileAnalysis:
    expected_source = _expected_from_filename(input_path)
    headers, rows, delimiter, duplicates = _read_rows(input_path)
    detected_source = detect_source(headers)
    warnings: List[str] = []

    missing_for_detected = _required_missing(detected_source, rows, headers)
    if missing_for_detected:
        warnings.append(
            f"Detected source '{detected_source}' is missing expected columns: "
            + ", ".join(missing_for_detected)
        )

    mismatched_label = (
        expected_source != SOURCE_UNKNOWN
        and detected_source != SOURCE_UNKNOWN
        and expected_source != detected_source
    )
    if mismatched_label:
        warnings.append(
            "Filename label/source mismatch: "
            f"expected '{expected_source}' from filename but detected '{detected_source}' "
            "from header signature."
        )

    if detected_source == SOURCE_UNKNOWN:
        warnings.append("Could not confidently detect source from headers.")

    output_path: Optional[str] = None
    if not dry_run and detected_source in SUPPORTED_SOURCES:
        normalized_rows = normalize_rows(detected_source, rows)
        output_name = f"{input_path.stem}.normalized.{detected_source}.csv"
        output_file = output_dir / output_name
        _write_csv(output_file, TEMPLATE_HEADERS[detected_source], normalized_rows)
        output_path = str(output_file)

    if strict_source and mismatched_label:
        raise SystemExit(
            "Strict mode failure: source mismatch detected for "
            f"{input_path.name} (expected {expected_source}, detected {detected_source})."
        )

    return FileAnalysis(
        input_path=str(input_path),
        expected_source_from_filename=expected_source,
        detected_source_from_header=detected_source,
        header_count=len(headers),
        row_count=len(rows),
        delimiter="TAB" if delimiter == "\t" else "COMMA",
        mismatched_label=mismatched_label,
        duplicate_headers=duplicates,
        missing_required_for_detected=missing_for_detected,
        output_path=output_path,
        warnings=warnings,
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Normalize CRM source exports into template CSVs and flag mislabeled files."
        )
    )
    parser.add_argument(
        "--inputs",
        nargs="+",
        required=True,
        help="Input file paths (.csv/.txt exports).",
    )
    parser.add_argument(
        "--out-dir",
        default="normalized",
        help="Output folder for normalized CSV files.",
    )
    parser.add_argument(
        "--report-path",
        default="normalization_report.json",
        help="Path for JSON analysis report.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Analyze and flag only, do not write normalized files.",
    )
    parser.add_argument(
        "--strict-source",
        action="store_true",
        help="Fail on filename/source mismatch.",
    )
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    output_dir = Path(args.out_dir).resolve()
    report_path = Path(args.report_path).resolve()

    analyses: List[FileAnalysis] = []
    mismatch_count = 0
    warning_count = 0

    for raw_path in args.inputs:
        in_path = Path(raw_path).resolve()
        analysis = analyze_and_normalize_file(
            input_path=in_path,
            output_dir=output_dir,
            dry_run=args.dry_run,
            strict_source=args.strict_source,
        )
        analyses.append(analysis)
        mismatch_count += 1 if analysis.mismatched_label else 0
        warning_count += len(analysis.warnings)

    report = {
        "summary": {
            "files_processed": len(analyses),
            "mismatched_labels": mismatch_count,
            "warnings": warning_count,
            "dry_run": bool(args.dry_run),
            "out_dir": str(output_dir),
        },
        "files": [analysis.__dict__ for analysis in analyses],
    }

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(json.dumps(report["summary"], indent=2))
    print(f"Report written: {report_path}")
    for analysis in analyses:
        if analysis.warnings:
            print(f"- {Path(analysis.input_path).name}")
            for warning in analysis.warnings:
                print(f"  WARNING: {warning}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
