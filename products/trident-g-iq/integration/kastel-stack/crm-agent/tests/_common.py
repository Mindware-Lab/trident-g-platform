from __future__ import annotations

import json
import sys
from pathlib import Path


TESTS_DIR = Path(__file__).resolve().parent
FIXTURES_DIR = TESTS_DIR / "fixtures"
CRM_AGENT_DIR = TESTS_DIR.parent


def load_json(name: str):
    path = FIXTURES_DIR / name
    return json.loads(path.read_text(encoding="utf-8"))


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def ok(message: str) -> None:
    print(f"OK: {message}")


def run_guard(fn):
    try:
        fn()
    except SystemExit:
        raise
    except Exception as exc:  # pragma: no cover - defensive fallback
        fail(f"Unexpected error: {exc}")
    sys.exit(0)
