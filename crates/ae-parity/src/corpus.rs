//! Reading the two committed reference corpora.
//!
//! Both are compiled in with `include_str!` rather than read from disk, for the
//! same reason the crates under test do it: the matrix must be reproducible from
//! a checkout with no network and no working directory assumptions, and a path
//! that resolves differently under `cargo test` and under `cargo run` is a way
//! to report a matrix for a corpus nobody committed.

use ae_core::tx::{Pointer, Tag, TxParams, Value};
use serde_json::Value as Json;

/// The transaction corpus, generated from `@aeternity/aepp-sdk`.
pub const TRANSACTIONS: &str = include_str!("../../ae-core/tests/vectors/transactions.json");

/// The FATE corpus, generated from `@aeternity/aepp-calldata`.
pub const FATE: &str = include_str!("../../ae-fate/tests/vectors/aepp-calldata-1.9.1.json");

/// One transaction vector.
#[derive(Debug, Clone)]
pub struct TxCase {
    /// The case's name in the generator's table.
    pub name: String,
    /// The transaction tag.
    pub tag: Tag,
    /// The version the generator pinned, when it pinned one.
    pub pinned_version: Option<u32>,
    /// The `tx_…` string the reference produced.
    pub tx: String,
    /// The parameter names the generator set, before the fee was pinned.
    pub param_names: Vec<String>,
    /// The parameters, ready to build.
    pub params: TxParams,
    /// Whether the vector carries an explicit `fee`.
    ///
    /// Note what this cannot tell you. The generator derives the reference's own
    /// minimum fee and writes it back into every case whose tag has a fee field,
    /// so a vector never records whether the fee was *given* or *derived* — the
    /// fixed-point iteration is erased by the act of committing the corpus. A
    /// vector with no fee is one whose tag has no fee field at all.
    pub fee_present: bool,
    /// Why a node's decoder refuses this vector, when one does.
    ///
    /// `None` is the ordinary case: the bytes are correct *and* the transaction
    /// is one a node will take. `Some` marks a vector whose bytes are correct and
    /// whose content the chain rejects — a valid encoding test that must never
    /// count towards the on-node clause of parity green.
    pub refused_by: Option<Refusal>,
}

/// A chain rule that refuses a vector, and the vector that stands in for it.
#[derive(Debug, Clone)]
pub struct Refusal {
    /// The node's `error_code` for it, measured rather than assumed.
    pub error_code: String,
    /// The rule, in a sentence a reviewer can check against a node.
    pub rule: String,
    /// The vector that gives this tag its acceptance result, if it has one.
    ///
    /// `None` is a **named exception**: the tag has no accepted vector at all,
    /// which is a finding against the tag rather than a hole in the corpus.
    pub sibling: Option<String>,
}

/// One FATE vector: a name and the bytes the reference produced.
#[derive(Debug, Clone)]
pub struct FateCase {
    /// The case's name in the generator's table, `family/detail`.
    pub name: String,
    /// The reference bytes.
    pub bytes: Vec<u8>,
}

/// The reference versions the corpora record for themselves.
#[derive(Debug, Clone)]
pub struct References {
    /// `@aeternity/aepp-sdk`, from the transaction corpus.
    pub aepp_sdk: String,
    /// `@aeternity/aepp-calldata`, from the FATE corpus.
    pub aepp_calldata: String,
}

/// Read both corpora's recorded reference versions.
///
/// # Panics
///
/// If either corpus is not the shape its generator emits. That is a hard failure
/// on purpose: a matrix computed from a corpus this cannot parse would be a
/// number with nothing behind it.
pub fn references() -> References {
    let transactions: Json =
        serde_json::from_str(TRANSACTIONS).expect("transaction corpus is json");
    let fate: Json = serde_json::from_str(FATE).expect("fate corpus is json");
    References {
        aepp_sdk: transactions["sdkVersion"]
            .as_str()
            .expect("corpus records its sdk version")
            .to_string(),
        aepp_calldata: fate["version"]
            .as_str()
            .expect("corpus records its calldata version")
            .to_string(),
    }
}

/// Every transaction vector, in corpus order.
///
/// # Panics
///
/// If a case cannot be read at all — an unknown tag or an unknown typed-value
/// wrapper. A case that reads but does not *build* is a parity failure and is
/// reported in the matrix rather than panicking here.
pub fn transactions() -> Vec<TxCase> {
    let corpus: Json = serde_json::from_str(TRANSACTIONS).expect("transaction corpus is json");
    corpus["cases"]
        .as_array()
        .expect("corpus has cases")
        .iter()
        .map(read_tx_case)
        .collect()
}

/// Every FATE vector, in corpus order.
///
/// # Panics
///
/// If the corpus is not the shape its generator emits.
pub fn fate() -> Vec<FateCase> {
    let corpus: Json = serde_json::from_str(FATE).expect("fate corpus is json");
    corpus["vectors"]
        .as_array()
        .expect("corpus has vectors")
        .iter()
        .map(|case| FateCase {
            name: case["name"].as_str().expect("case has a name").to_string(),
            bytes: hex_decode(case["hex"].as_str().expect("case has hex")),
        })
        .collect()
}

fn read_tx_case(case: &Json) -> TxCase {
    let tag = Tag::from_u32(case["tag"].as_u64().expect("case has a tag") as u32)
        .expect("corpus tag is known");
    let pinned_version = case["version"].as_u64().map(|version| version as u32);
    let mut params = TxParams::new(tag);
    if let Some(version) = pinned_version {
        params = params.with_version(version);
    }
    let object = case["params"].as_object().expect("case has params");
    let mut param_names = Vec::with_capacity(object.len());
    for (name, value) in object {
        param_names.push(name.clone());
        params.set(name, read_value(value));
    }
    TxCase {
        name: case["name"].as_str().expect("case has a name").to_string(),
        tag,
        pinned_version,
        tx: case["tx"].as_str().expect("case has a tx").to_string(),
        fee_present: param_names.iter().any(|name| name == "fee"),
        refused_by: read_refusal(case),
        param_names,
        params,
    }
}

fn read_refusal(case: &Json) -> Option<Refusal> {
    // Absent means postable. A vector that is silently missing the field would
    // otherwise read as non-postable and drop itself out of the on-node clause,
    // which is the one direction this must never fail in.
    if case["postable"].as_bool().unwrap_or(true) {
        return None;
    }
    let refused = &case["refusedBy"];
    Some(Refusal {
        error_code: refused["errorCode"]
            .as_str()
            .expect("a non-postable vector names the error code")
            .to_string(),
        rule: refused["rule"]
            .as_str()
            .expect("a non-postable vector names the rule that refuses it")
            .to_string(),
        sibling: refused["sibling"].as_str().map(ToString::to_string),
    })
}

fn read_value(json: &Json) -> Value {
    let kind = json["t"].as_str().expect("typed value");
    let raw = &json["v"];
    match kind {
        "enc" => Value::Encoded(raw.as_str().expect("string").to_string()),
        "text" => Value::Text(raw.as_str().expect("string").to_string()),
        "uint" => Value::uint_str(raw.as_str().expect("string")).expect("decimal"),
        "bytes" => Value::Bytes(hex_decode(raw.as_str().expect("string"))),
        "list" => Value::List(
            raw.as_array()
                .expect("array")
                .iter()
                .map(read_value)
                .collect(),
        ),
        "pointers" => Value::Pointers(
            raw.as_array()
                .expect("array")
                .iter()
                .map(|pointer| Pointer {
                    key: pointer["key"].as_str().expect("string").to_string(),
                    id: pointer["id"].as_str().expect("string").to_string(),
                })
                .collect(),
        ),
        "ctversion" => Value::CtVersion {
            vm_version: raw["vm"].as_u64().expect("number") as u8,
            abi_version: raw["abi"].as_u64().expect("number") as u8,
        },
        other => panic!("unknown typed value {other}"),
    }
}

fn hex_decode(input: &str) -> Vec<u8> {
    (0..input.len())
        .step_by(2)
        .map(|index| u8::from_str_radix(&input[index..index + 2], 16).expect("hex"))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn both_corpora_parse_and_record_their_reference_version() {
        let references = references();
        assert!(!references.aepp_sdk.is_empty());
        assert!(!references.aepp_calldata.is_empty());
        assert!(!transactions().is_empty());
        assert!(!fate().is_empty());
    }
}
