from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Sequence


EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")


@dataclass
class NormalizeSummary:
    input_path: str
    output_csv_path: str
    output_json_path: str
    request_type: str
    source_system: str
    total_lines: int
    accepted_rows: int
    duplicate_rows: int
    invalid_rows: int


def _clean_email(raw: str) -> str:
    return raw.strip().lower()


def _valid_email(email: str) -> bool:
    return bool(EMAIL_PATTERN.match(email))


def normalize_unsubscribe_lines(
    lines: Sequence[str],
    request_type: str,
    source_system: str,
    requested_at: str,
) -> tuple[List[dict], int, int]:
    records: List[dict] = []
    seen = set()
    duplicate_rows = 0
    invalid_rows = 0

    for line in lines:
        email = _clean_email(line)
        if not email:
            continue
        if not _valid_email(email):
            invalid_rows += 1
            continue
        if email in seen:
            duplicate_rows += 1
            continue
        seen.add(email)
        records.append(
            {
                "email": email,
                "request_type": request_type,
                "source_system": source_system,
                "requested_at": requested_at,
                "note": "manual unsubscribe/privacy list import",
            }
        )

    return records, duplicate_rows, invalid_rows


def _write_csv(path: Path, rows: Sequence[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=[
                "email",
                "request_type",
                "source_system",
                "requested_at",
                "note",
            ],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def _write_json(path: Path, rows: Sequence[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"records": list(rows)}, indent=2), encoding="utf-8")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Normalize one-email-per-line unsubscribe lists into CRM privacy intake payloads."
    )
    parser.add_argument("--input", required=True, help="Path to unsubscribe list file.")
    parser.add_argument(
        "--out-csv",
        required=True,
        help="Output CSV path with normalized privacy request rows.",
    )
    parser.add_argument(
        "--out-json",
        required=True,
        help="Output JSON path containing `records` for n8n payload.",
    )
    parser.add_argument(
        "--request-type",
        default="erase",
        choices=["unsubscribe", "erase"],
        help="Privacy request type. Use `erase` when requester asks for data deletion.",
    )
    parser.add_argument(
        "--source-system",
        default="manual_unsubscribe_list",
        help="Source system label stored in payload.",
    )
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    input_path = Path(args.input).resolve()
    out_csv = Path(args.out_csv).resolve()
    out_json = Path(args.out_json).resolve()

    lines = input_path.read_text(encoding="utf-8-sig", errors="replace").splitlines()
    requested_at = datetime.now(timezone.utc).isoformat()
    rows, duplicate_rows, invalid_rows = normalize_unsubscribe_lines(
        lines=lines,
        request_type=args.request_type,
        source_system=args.source_system,
        requested_at=requested_at,
    )

    _write_csv(out_csv, rows)
    _write_json(out_json, rows)

    summary = NormalizeSummary(
        input_path=str(input_path),
        output_csv_path=str(out_csv),
        output_json_path=str(out_json),
        request_type=args.request_type,
        source_system=args.source_system,
        total_lines=len(lines),
        accepted_rows=len(rows),
        duplicate_rows=duplicate_rows,
        invalid_rows=invalid_rows,
    )
    print(json.dumps(summary.__dict__, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
