//! The round-trip sweep: everything `@aeternity/aepp-calldata` 1.9.1 wrote over
//! a systematic walk of the value space, decoded and re-encoded here.
//!
//! `tests/vectors.rs` proves the two implementations *choose* the same encoding,
//! but only for cases somebody thought to write down twice. This one is the
//! other half: it is wide, it has no hand-written twin, and it asserts the
//! weaker property that catches the cases nobody thought of — that this crate
//! reads what the reference writes and writes back the identical bytes.
//!
//! A failure here is a divergence, not a typo in a twin. Two exclusions are
//! baked into the corpus and documented in `vectors/generate-sweep.mjs`: map
//! keys that are non-ASCII strings, and map keys that are negative bit fields.
//! Both are known divergences where this crate deliberately follows the node
//! rather than the reference, so including them would assert the disagreement
//! away. Everything else the reference can produce is in.

use ae_fate::{deserialize, serialize};

const SWEEP: &str = include_str!("vectors/aepp-calldata-1.9.1-sweep.json");

/// Reads the `{"name", "hex"}` pairs out of the corpus. The generator fixes the
/// file's shape, so this stays a scanner rather than a JSON parser and the
/// crate keeps its empty dependency list.
fn corpus() -> Vec<(String, Vec<u8>)> {
    let mut pairs = Vec::new();
    let mut name: Option<String> = None;
    for line in SWEEP.lines() {
        let line = line.trim();
        if let Some(value) = field(line, "\"name\":") {
            name = Some(value);
        } else if let Some(value) = field(line, "\"hex\":") {
            let hex = value;
            let bytes = (0..hex.len())
                .step_by(2)
                .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).expect("hex"))
                .collect();
            pairs.push((name.take().expect("name precedes hex"), bytes));
        }
    }
    assert!(!pairs.is_empty(), "sweep corpus is empty");
    pairs
}

fn field(line: &str, key: &str) -> Option<String> {
    let rest = line.strip_prefix(key)?.trim();
    let rest = rest.strip_prefix('"')?;
    let end = rest.find('"')?;
    Some(rest[..end].to_string())
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

#[test]
fn re_encodes_everything_the_reference_writes() {
    let corpus = corpus();
    for (name, expected) in &corpus {
        let value = match deserialize(expected) {
            Ok(value) => value,
            Err(error) => panic!(
                "{name}: reference output rejected — {error} — {}",
                hex(expected)
            ),
        };
        let re_encoded = serialize(&value).unwrap_or_else(|error| panic!("{name}: {error}"));
        assert_eq!(
            hex(&re_encoded),
            hex(expected),
            "{name}: decoded and re-encoded to different bytes"
        );
    }
    // A corpus that silently shrank would pass every assertion above. This is
    // the count at the reference version named in the file; regenerating
    // against a new one is expected to move it, deliberately and in the diff.
    assert_eq!(corpus.len(), 521, "sweep corpus changed size");
}

/// The sweep would still pass if `deserialize` were lenient in a way the
/// reference is not, so the strictness rulings get their own direct checks
/// rather than being implied by a corpus that cannot contain them.
#[test]
fn stays_strict_where_the_reference_is_lenient() {
    // Measured against 1.9.1: it decodes both of these. See
    // `tests/divergence.rs` for the ruling and the reason.
    assert!(deserialize(&[0x80]).is_err(), "negative zero");
    assert!(
        deserialize(&[0x6f, 0x82, 0x00, 0x01]).is_err(),
        "leading zero"
    );
    assert!(deserialize(&[0x6f, 0x80]).is_err(), "empty magnitude");
}
