"""Prepara el piloto B0-B2: verifica SHA-256 de los bundles promovidos y extrae
los runtimes exactos (sin modificar bytes) a una ruta corta fuera del repo.

La ruta del repo supera el limite MAX_PATH de Windows para los archivos mas
profundos de los runtimes, por eso se extraen en PILOT_HOME.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import sys
import zipfile
from pathlib import Path

DOWNLOADS = Path(os.environ.get("EVE_BUNDLES_DIR", r"C:\Users\migue\Downloads\IA Asistencia Runtime"))
PILOT_HOME = Path(os.environ.get("EVE_PILOT_HOME", Path.home() / "eve-pilot-b0-b2"))

BUNDLES = {
    "B0": {
        "zip": "EVE_B0_FINAL_PROMOTION_BUNDLE_v1_1_CERRADO(1).zip",
        "sums": ["SHA256SUMS_EVE_B0_FINAL_PROMOTION_v1_1.txt"],
        "runtime_zip": "B0_RUNTIME_MVP_v0_1_R8P_PROMOTED_SELF_CONTAINED.zip",
        "runtime_root": "b0_runtime_mvp",
        "target": "b0",
    },
    "B05": {
        "zip": "EVE_MESA_B05_FINAL_PROMOTED_v1_0.zip",
        "sums": ["SHA256SUMS_PROMOTED.txt", "SHA256SUMS.txt"],
        "runtime_zip": "B05_RUNTIME_MVP_v1_1_R2_SELF_CONTAINED.zip",
        "runtime_root": "b05_runtime_mvp",
        "target": "b05",
    },
    "B1": {
        "zip": "EVE_B1_FINAL_PROMOTION_BUNDLE_v1_0_CERRADO.zip",
        "sums": ["PROMOTION_SHA256SUMS.txt"],
        "runtime_zip": "B1_Runtime_Self_Contained_v1_1_PROMOTED_EXACT.zip",
        "runtime_root": "",
        "target": "b1",
    },
    "B2": {
        "zip": "EVE_B2_FINAL_PROMOTION_BUNDLE_v1_0_CERRADO.zip",
        "sums": ["SHA256SUMS.txt"],
        "runtime_zip": "B2_Runtime_MVP_v0_2_2_R1_PROMOTED_SELF_CONTAINED.zip",
        "runtime_root": "eve_capture_runtime_mvp_v0_2_2",
        "target": "b2",
    },
}

SUM_LINE = re.compile(r"^([0-9a-f]{64})\s+\*?(.+)$")


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_sums(bundle_dir: Path, sums_files: list[str]) -> list[dict]:
    results = []
    for sums_name in sums_files:
        for line in (bundle_dir / sums_name).read_text(encoding="utf-8").splitlines():
            m = SUM_LINE.match(line.strip())
            if not m:
                continue
            expected, name = m.group(1), m.group(2).strip()
            target = bundle_dir / name
            actual = sha256(target) if target.exists() else None
            results.append({"sums_file": sums_name, "file": name, "expected": expected, "actual": actual, "ok": actual == expected})
    return results


def main() -> int:
    if PILOT_HOME.exists():
        shutil.rmtree(PILOT_HOME)
    (PILOT_HOME / "bundles").mkdir(parents=True)
    (PILOT_HOME / "runtimes").mkdir(parents=True)

    report = {"pilot_home": str(PILOT_HOME), "bundles": {}}
    failed = False
    for key, spec in BUNDLES.items():
        outer = DOWNLOADS / spec["zip"]
        bundle_dir = PILOT_HOME / "bundles" / key
        with zipfile.ZipFile(outer) as zf:
            zf.extractall(bundle_dir)
        checks = verify_sums(bundle_dir, spec["sums"])
        ok = bool(checks) and all(c["ok"] for c in checks)
        failed |= not ok

        runtime_zip = bundle_dir / spec["runtime_zip"]
        staging = PILOT_HOME / "runtimes" / f"_{spec['target']}"
        with zipfile.ZipFile(runtime_zip) as zf:
            zf.extractall(staging)
        src = staging / spec["runtime_root"] if spec["runtime_root"] else staging
        dest = PILOT_HOME / "runtimes" / spec["target"]
        shutil.move(str(src), str(dest))
        if staging.exists():
            shutil.rmtree(staging)

        report["bundles"][key] = {
            "outer_zip": spec["zip"],
            "outer_zip_sha256": sha256(outer),
            "runtime_zip": spec["runtime_zip"],
            "runtime_zip_sha256": sha256(runtime_zip),
            "sha256_checks_ok": ok,
            "sha256_checks": checks,
            "runtime_dir": str(dest),
        }

    (PILOT_HOME / "SETUP_REPORT.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    for key, info in report["bundles"].items():
        print(f"{key}: sha256={'OK' if info['sha256_checks_ok'] else 'FAIL'} runtime={info['runtime_dir']}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
