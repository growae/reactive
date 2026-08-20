"""Byte-parity against the reference JavaScript SDK, through this binding.

Mirrors `crates/ae-core/tests/vectors.rs`: every case in
`vectors/transactions.json` was built by `@aeternity/aepp-sdk` and carries the
`tx_...` string it produced. This rebuilds each one through the Python
binding and asserts the strings are identical, then unpacks and rebuilds to
prove the round trip does not lose a byte.
"""

import json
from pathlib import Path

import pytest

import ae_core as core

CORPUS_PATH = (
    Path(__file__).parent.parent.parent.parent
    / "crates"
    / "ae-core"
    / "tests"
    / "vectors"
    / "transactions.json"
)


def load_corpus():
    with open(CORPUS_PATH, encoding="utf-8") as handle:
        return json.load(handle)


CORPUS = load_corpus()
CASES = CORPUS["cases"]


def value_from_json(spec):
    kind = spec["t"]
    raw = spec["v"]
    if kind == "enc":
        return core.Value.encoded(raw)
    if kind == "text":
        return core.Value.text(raw)
    if kind == "uint":
        return core.Value.uint_str(raw)
    if kind == "bytes":
        return core.Value.bytes(bytes.fromhex(raw))
    if kind == "list":
        return core.Value.list([value_from_json(item) for item in raw])
    if kind == "pointers":
        return core.Value.pointers([(p["key"], p["id"]) for p in raw])
    if kind == "ctversion":
        return core.Value.ct_version(raw["vm"], raw["abi"])
    raise ValueError(f"unknown value type {kind}")


def params_from_case(case):
    params = core.TxParams(case["tag"])
    if case.get("version") is not None:
        params.set_version(case["version"])
    for name, value in case["params"].items():
        params.set(name, value_from_json(value))
    return params


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_every_vector_builds_to_the_same_bytes_as_the_reference(case):
    built = core.build_tx(params_from_case(case))
    assert built == case["tx"]


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_every_vector_survives_unpack_then_rebuild(case):
    unpacked = core.unpack_tx(case["tx"])
    rebuilt = core.build_tx(unpacked)
    assert rebuilt == case["tx"]


def test_corpus_is_not_empty():
    assert len(CASES) == 40
