//! Byte-parity against the reference JavaScript SDK.
//!
//! Every case in `vectors/transactions.json` was built by `@aeternity/aepp-sdk`
//! and carries the `tx_` string it produced. This test rebuilds each one through
//! this crate and asserts the strings are identical, then unpacks and rebuilds to
//! prove the round trip does not lose a byte.
//!
//! This is **not** the differential harness. That is a separate piece of work: it
//! regenerates on every SDK release, covers the fee fixed point with the field
//! omitted, and puts a node in the loop as a third opinion so the failure mode
//! where both implementations agree and are both wrong is visible. This is the
//! floor it will sit on.

use reactive_core::tx::{build_tx, unpack_tx, Pointer, Tag, TxParams, Value, TX_SCHEMA};
use serde_json::Value as Json;
use std::collections::BTreeSet;

const CORPUS: &str = include_str!("vectors/transactions.json");

fn corpus() -> Json {
    serde_json::from_str(CORPUS).expect("corpus is valid json")
}

fn value_from_json(json: &Json) -> Value {
    let kind = json["t"].as_str().expect("typed value");
    let raw = &json["v"];
    match kind {
        "enc" => Value::Encoded(raw.as_str().unwrap().to_string()),
        "text" => Value::Text(raw.as_str().unwrap().to_string()),
        "uint" => Value::uint_str(raw.as_str().unwrap()).unwrap(),
        "bytes" => Value::Bytes(hex_decode(raw.as_str().unwrap())),
        "list" => Value::List(
            raw.as_array()
                .unwrap()
                .iter()
                .map(value_from_json)
                .collect(),
        ),
        "pointers" => Value::Pointers(
            raw.as_array()
                .unwrap()
                .iter()
                .map(|p| Pointer {
                    key: p["key"].as_str().unwrap().to_string(),
                    id: p["id"].as_str().unwrap().to_string(),
                })
                .collect(),
        ),
        "ctversion" => Value::CtVersion {
            vm_version: raw["vm"].as_u64().unwrap() as u8,
            abi_version: raw["abi"].as_u64().unwrap() as u8,
        },
        other => panic!("unknown value type {other}"),
    }
}

fn hex_decode(input: &str) -> Vec<u8> {
    (0..input.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&input[i..i + 2], 16).expect("hex"))
        .collect()
}

fn params_from_case(case: &Json) -> TxParams {
    let tag = Tag::from_u32(case["tag"].as_u64().unwrap() as u32).unwrap();
    let mut params = TxParams::new(tag);
    if let Some(version) = case["version"].as_u64() {
        params = params.with_version(version as u32);
    }
    for (name, value) in case["params"].as_object().unwrap() {
        params.set(name, value_from_json(value));
    }
    params
}

#[test]
fn every_vector_builds_to_the_same_bytes_as_the_reference() {
    let corpus = corpus();
    let cases = corpus["cases"].as_array().unwrap();
    assert!(!cases.is_empty());

    let mut failures = Vec::new();
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let expected = case["tx"].as_str().unwrap();
        match build_tx(&params_from_case(case)) {
            Ok(built) if built == expected => {}
            Ok(built) => {
                failures.push(format!("{name}\n  expected {expected}\n  built    {built}"))
            }
            Err(error) => failures.push(format!("{name}\n  errored  {error}")),
        }
    }
    assert!(
        failures.is_empty(),
        "{} of {} vectors diverged from {}:\n{}",
        failures.len(),
        cases.len(),
        corpus["sdkVersion"].as_str().unwrap(),
        failures.join("\n")
    );
}

#[test]
fn every_vector_survives_unpack_then_rebuild() {
    let corpus = corpus();
    for case in corpus["cases"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let expected = case["tx"].as_str().unwrap();
        let unpacked = unpack_tx(expected).unwrap_or_else(|e| panic!("{name}: unpack failed: {e}"));
        let rebuilt = build_tx(&unpacked).unwrap_or_else(|e| panic!("{name}: rebuild failed: {e}"));
        assert_eq!(rebuilt, expected, "{name} did not survive the round trip");
    }
}

#[test]
fn unpacking_twice_gives_the_same_parameters() {
    let corpus = corpus();
    for case in corpus["cases"].as_array().unwrap() {
        let tx = case["tx"].as_str().unwrap();
        assert_eq!(unpack_tx(tx).unwrap(), unpack_tx(tx).unwrap());
    }
}

#[test]
fn the_corpus_covers_every_tag_and_every_schema_entry() {
    let corpus = corpus();
    let mut covered: BTreeSet<(u32, u32)> = BTreeSet::new();
    for case in corpus["cases"].as_array().unwrap() {
        let params = unpack_tx(case["tx"].as_str().unwrap()).unwrap();
        covered.insert((params.tag().as_u32(), params.version().unwrap()));
    }

    let expected: BTreeSet<(u32, u32)> = TX_SCHEMA
        .iter()
        .map(|entry| (entry.tag.as_u32(), entry.version))
        .collect();

    let missing: Vec<_> = expected.difference(&covered).collect();
    assert!(
        missing.is_empty(),
        "schema entries with no vector: {missing:?}"
    );
    assert_eq!(covered.len(), 27);
}
