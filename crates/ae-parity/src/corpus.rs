//! Reading the committed reference corpora.
//!
//! All are compiled in with `include_str!` rather than read from disk, for the
//! same reason the crates under test do it: the matrix must be reproducible from
//! a checkout with no network and no working directory assumptions, and a path
//! that resolves differently under `cargo test` and under `cargo run` is a way
//! to report a matrix for a corpus nobody committed.
//!
//! # Why the FATE corpora are a list and not a constant
//!
//! There was one `include_str!` here and there were two committed FATE corpora,
//! so the matrix reported 113 vectors of 636 and the row read fully covered.
//! Nothing was wrong with the number; it was a number about a corpus, presented
//! as a number about the crate.
//!
//! The defect class is that a new corpus file is invisible by default: it costs
//! nothing to add one, and nothing anywhere notices it was never read.
//! [`FATE_CORPORA`] is the single place a corpus becomes visible, and
//! `tests/reachability.rs` walks the committed directory and fails when a file
//! is not in it. Adding a corpus and forgetting to list it is now a red gate
//! rather than a silently smaller matrix.

use ae_core::tx::{Pointer, Tag, TxParams, Value};
use serde_json::Value as Json;

/// The transaction corpus, generated from `@aeternity/aepp-sdk`.
pub const TRANSACTIONS: &str = include_str!("../../ae-core/tests/vectors/transactions.json");

/// One committed FATE corpus.
#[derive(Debug, Clone, Copy)]
pub struct FateCorpusFile {
    /// The file name as committed, which is what the reachability gate walks the
    /// vector directory for.
    pub file: &'static str,
    /// The corpus text, compiled in.
    pub text: &'static str,
}

/// Every committed FATE corpus, in the order the matrix reports them.
///
/// A file here is measured. A file in `ae-fate/tests/vectors` that is not here
/// is invisible to the matrix — which is the whole of the defect this list and
/// its reachability gate exist to make impossible.
pub const FATE_CORPORA: [FateCorpusFile; 2] = [
    FateCorpusFile {
        file: "aepp-calldata-1.9.1.json",
        text: include_str!("../../ae-fate/tests/vectors/aepp-calldata-1.9.1.json"),
    },
    FateCorpusFile {
        file: "aepp-calldata-1.9.1-sweep.json",
        text: include_str!("../../ae-fate/tests/vectors/aepp-calldata-1.9.1-sweep.json"),
    },
];

/// Where a FATE vector's bytes came from.
///
/// The two classes are never merged into one total, because they are not the
/// same evidence. A reference-written vector is two implementations agreeing. A
/// twinned vector is this repository agreeing with a rule this repository also
/// wrote down — real evidence, weaker evidence, and a single count hides which
/// kind a row rests on.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Provenance {
    /// Written by `@aeternity/aepp-calldata` itself.
    Reference,
    /// Assembled in this repository rather than by the reference, because the
    /// reference *cannot* produce these bytes: they are maps keyed by non-ASCII
    /// strings and by negative bit fields, the two places where its ordering
    /// disagrees with the node's, so asking it to write them would produce bytes
    /// the chain rejects. The key order is stated by hand from `aeb_fate_data`
    /// rather than measured. See `ae-fate/tests/sweep.rs`, which says the same
    /// thing about the same two cases.
    Twinned,
}

impl Provenance {
    /// How the class is named in the rendered matrix and in the json.
    pub fn label(self) -> &'static str {
        match self {
            Provenance::Reference => "reference-written",
            Provenance::Twinned => "twinned by construction",
        }
    }
}

/// The evidence class a vector's name declares.
///
/// The generator names the two hand-assembled cases `node-order/…` rather than
/// `sweep/…` precisely so they stay distinguishable in the committed file. This
/// reads that convention rather than inventing a second one.
fn provenance_of(name: &str) -> Provenance {
    match name.split('/').next().unwrap_or_default() {
        "node-order" => Provenance::Twinned,
        _ => Provenance::Reference,
    }
}

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

/// One FATE vector: a name, the bytes, and where the bytes came from.
#[derive(Debug, Clone)]
pub struct FateCase {
    /// The case's name in the generator's table, `family/detail`.
    pub name: String,
    /// The committed corpus this case was read from.
    pub corpus: &'static str,
    /// Whether the reference wrote these bytes or this repository did.
    pub provenance: Provenance,
    /// The bytes.
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

/// Read every corpus's recorded reference version.
///
/// # Panics
///
/// If a corpus is not the shape its generator emits. That is a hard failure on
/// purpose: a matrix computed from a corpus this cannot parse would be a number
/// with nothing behind it.
///
/// Also if the FATE corpora disagree about their reference version. The matrix
/// prints one `aepp-calldata` version in its header and scores every FATE vector
/// against it; two corpora generated from different versions would make that
/// header a claim about vectors that were never produced by it.
pub fn references() -> References {
    let transactions: Json =
        serde_json::from_str(TRANSACTIONS).expect("transaction corpus is json");

    let mut aepp_calldata: Option<String> = None;
    for corpus in FATE_CORPORA {
        let json: Json = serde_json::from_str(corpus.text).expect("fate corpus is json");
        let version = json["version"]
            .as_str()
            .expect("corpus records its calldata version")
            .to_string();
        match &aepp_calldata {
            None => aepp_calldata = Some(version),
            Some(first) => assert_eq!(
                first, &version,
                "{} records aepp-calldata {version}, but an earlier corpus records {first}",
                corpus.file
            ),
        }
    }

    References {
        aepp_sdk: transactions["sdkVersion"]
            .as_str()
            .expect("corpus records its sdk version")
            .to_string(),
        aepp_calldata: aepp_calldata.expect("at least one fate corpus is committed"),
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

/// Every FATE vector from every committed corpus, in corpus order then case
/// order.
///
/// # Panics
///
/// If a corpus is not the shape its generator emits.
pub fn fate() -> Vec<FateCase> {
    let mut cases = Vec::new();
    for corpus in FATE_CORPORA {
        let json: Json = serde_json::from_str(corpus.text).expect("fate corpus is json");
        for case in json["vectors"].as_array().expect("corpus has vectors") {
            let name = case["name"].as_str().expect("case has a name").to_string();
            cases.push(FateCase {
                corpus: corpus.file,
                provenance: provenance_of(&name),
                name,
                bytes: hex_decode(case["hex"].as_str().expect("case has hex")),
            });
        }
    }
    cases
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
    fn every_corpus_parses_and_records_its_reference_version() {
        let references = references();
        assert!(!references.aepp_sdk.is_empty());
        assert!(!references.aepp_calldata.is_empty());
        assert!(!transactions().is_empty());
        assert!(!fate().is_empty());
    }

    /// A corpus listed but never read contributes nothing, and the matrix would
    /// look exactly the same as it did before someone added it.
    #[test]
    fn every_listed_fate_corpus_contributes_at_least_one_vector() {
        let cases = fate();
        for corpus in FATE_CORPORA {
            assert!(
                cases.iter().any(|case| case.corpus == corpus.file),
                "{} is listed but contributes no vector",
                corpus.file
            );
        }
    }

    /// The classification is read off the generator's own naming convention, so
    /// it is worth one assertion that the convention is still what it was.
    #[test]
    fn the_node_order_cases_are_the_twinned_ones() {
        for case in fate() {
            let expected = if case.name.starts_with("node-order/") {
                Provenance::Twinned
            } else {
                Provenance::Reference
            };
            assert_eq!(case.provenance, expected, "{}", case.name);
        }
    }
}
