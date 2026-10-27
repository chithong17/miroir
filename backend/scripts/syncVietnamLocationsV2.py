"""Rebuild the two-level snapshot and conversion table without installing packages.

Run from the repository root: python backend/scripts/syncVietnamLocationsV2.py
The legacy snapshot is deliberately not overwritten.
"""
import ast
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile

TARGET = Path(__file__).resolve().parent.parent / "data"
SOURCE = "https://provinces.open-api.vn/api/v2/?depth=2"
PACKAGE_VERSION = "2026.9.0"
PACKAGE_SHA256 = "b5f3540a98937d38b9bebcbdb792fa4f5b9712737d41b05c7254beb2308ebcd1"


def fetch(url):
    with urlopen(url, timeout=60) as response:
        return response.read()


def parse_literal(node):
    # Parse conversion data only; never import or execute downloaded Python code.
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.Tuple):
        return [parse_literal(item) for item in node.elts]
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in {"OldToNewEntry", "OldWardRef", "NewWardRef"}:
        return [parse_literal(item) for item in node.args]
    raise ValueError("Unexpected conversion data syntax")


def main():
    provinces = json.loads(fetch(SOURCE))
    assert len(provinces) == 34, "Unexpected province count; review before updating"
    wards = [ward for province in provinces for ward in province["wards"]]
    assert len(wards) == 3321 and len({ward["code"] for ward in wards}) == 3321
    metadata = json.loads(fetch(f"https://pypi.org/pypi/vietnam-provinces/{PACKAGE_VERSION}/json"))
    wheel = next(item for item in metadata["urls"] if item["filename"].endswith(".whl"))
    archive = fetch(wheel["url"])
    digest = hashlib.sha256(archive).hexdigest()
    assert digest == wheel["digests"]["sha256"] == PACKAGE_SHA256, "Source archive checksum mismatch"
    with ZipFile(io.BytesIO(archive)) as package:
        tree = ast.parse(package.read("vietnam_provinces/_ward_conversion_2025.py").decode("utf-8"))
    table = next(node for node in tree.body if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name) and node.target.id == "OLD_TO_NEW").value
    rows = {str(key.value): parse_literal(value) for key, value in zip(table.keys, table.values)}
    stamp = datetime.now(timezone.utc).date().isoformat()
    snapshot = {"datasetVersion": f"OPENAPI-V2-{stamp}", "addressVersion": "v2", "source": SOURCE, "generatedAt": stamp,
                "provinces": [{"code": str(p["code"]), "name": p["name"], "wards": [{"code": str(w["code"]), "name": w["name"]} for w in p["wards"]]} for p in provinces]}
    mapping = {"datasetVersion": f"VIETNAM-PROVINCES-{PACKAGE_VERSION}", "source": "https://github.com/sunshine-tech/VietnamProvinces", "sourceFile": "_ward_conversion_2025.py", "license": "GPL-3.0-or-later", "packageSha256": digest, "effectiveDate": "2025-07-01",
               "wards": {key: {"districtCode": str(value[0][1]), "provinceCode": str(value[0][2]), "partlyMerged": value[0][3], "targets": [{"wardCode": str(w[0]), "provinceCode": str(w[1])} for w in value[1]]} for key, value in rows.items()}}
    (TARGET / "vn-admin-units-v2.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (TARGET / "vn-ward-conversion.json").write_text(json.dumps(mapping, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Updated 34 provinces, 3321 wards, {len(rows)} legacy mappings. Legacy catalog untouched.")


if __name__ == "__main__":
    main()
