"""Extract the canonical question fichas of the promoted Madres (B0, B0.5, B1) into
an inspectable JSON copy config used by the pilot bridge.

Input:  PILOT_HOME/madres_txt/{B0,B05,B1}.txt  (plain-text dumps of the promoted Madres)
Output: deliverables/pilot-b0-b2/config/madre_fichas.json

Only literal field values are copied. Nothing is paraphrased or completed.
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

PILOT_HOME = Path(os.environ.get("EVE_PILOT_HOME", Path.home() / "eve-pilot-b0-b2"))
OUT = Path(__file__).resolve().parent / "config" / "madre_fichas.json"

MADRES = {
    "B0": "B0.txt",
    "B05": "B05.txt",
    "B1": "B1.txt",
}

FIELDS = (
    "question_code",
    "canonical_question_text",
    "short_ui_label",
    "help_text",
    "canonical_help_text",
    "examples",
    "field_type",
    "answer_mode",
    "free_text_condition",
    "options",
    "canonical_options",
    "allows_free_text",
    "knowledge_basis_capture",
    "required_rule",
    "visibility_rule",
    "branching_rule",
)


def parse_fichas(text: str) -> dict[str, dict]:
    out: dict[str, dict] = {}
    blocks = re.split(r"^Ficha canónica\s+", text, flags=re.M)[1:]
    for block in blocks:
        lines = block.splitlines()
        header = lines[0].strip()
        rec: dict[str, str] = {}
        current = None
        buf: list[str] = []
        for raw in lines[1:]:
            if re.match(r"^(Ficha canónica|\d+(\.\d+)*\s+[A-ZÁÉÍÓÚ])", raw):
                break
            if raw.startswith(" | "):
                buf.append(raw[3:])
                continue
            if raw.strip() == "|":
                continue
            key = raw.strip()
            if current is not None:
                rec[current] = "\n".join(x for x in buf if x.strip()).strip()
            current = key if key in FIELDS else None
            buf = []
        if current is not None:
            rec[current] = "\n".join(x for x in buf if x.strip()).strip()
        code = rec.get("question_code") or header
        out[code] = rec
    return out


def split_examples(raw: str | None) -> list[str]:
    if not raw:
        return []
    parts = re.split(r"(?:^|\s|(?<=[.!?»”]))\d\)\s*", raw)
    return [p.strip() for p in parts if p.strip()]


def split_options(raw: str | None) -> list[str]:
    if not raw or raw.strip().upper() in {"N/A", "NO APLICA"}:
        return []
    sep = " / " if " / " in raw else ("; " if "; " in raw else None)
    items = raw.split(sep) if sep else [raw]
    return [i.strip() for i in items if i.strip()]


def main() -> None:
    result: dict = {"source": "promoted Madres (plain-text dump)", "blocks": {}}
    for block, fname in MADRES.items():
        path = PILOT_HOME / "madres_txt" / fname
        fichas = parse_fichas(path.read_text(encoding="utf-8"))
        normalized = {}
        for code, rec in fichas.items():
            normalized[code] = {
                "question_code": code,
                "text": rec.get("canonical_question_text"),
                "short_ui_label": rec.get("short_ui_label"),
                "help_text": rec.get("help_text") or rec.get("canonical_help_text"),
                "examples": split_examples(rec.get("examples")),
                "options": split_options(rec.get("options") or rec.get("canonical_options")),
                "field_type": rec.get("field_type"),
                "answer_mode": rec.get("answer_mode"),
                "free_text_condition": rec.get("free_text_condition"),
                "allows_free_text": rec.get("allows_free_text"),
                "knowledge_basis_capture": rec.get("knowledge_basis_capture"),
                "source_ref": f"Madre {block} · Ficha canónica {code}",
            }
        result["blocks"][block] = normalized
        print(block, len(normalized), sorted(normalized))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
