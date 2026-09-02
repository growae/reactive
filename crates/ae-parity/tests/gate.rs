//! The gate: what "parity green" means, expressed as assertions.
//!
//! Read `README.md` in this directory for the sentence these tests encode. The
//! two halves are deliberately different in kind:
//!
//! - **Invariants** — things that must hold at every commit. Every committed
//!   vector reproduces the reference's bytes; every vector round-trips; the
//!   committed matrix is the one this code produces. These fail the build.
//! - **Recorded gaps** — the surfaces that are *not* yet covered, pinned to their
//!   exact current values. These fail the build too, and that is the point: a gap
//!   closing is as much a reviewable event as a gap opening, and a number that
//!   silently drifts in the safe direction is a number nobody checks.

use ae_parity::{matrix, render};

#[test]
fn every_committed_transaction_vector_reproduces_the_reference_bytes() {
    let matrix = matrix::compute();
    let failures: Vec<&String> = matrix
        .transactions
        .iter()
        .flat_map(|row| row.failures.iter())
        .collect();
    assert!(
        failures.is_empty(),
        "{} transaction vectors diverge from {}:\n{}",
        failures.len(),
        matrix.references.aepp_sdk,
        failures
            .iter()
            .map(|failure| format!("  {failure}"))
            .collect::<Vec<_>>()
            .join("\n")
    );
}

#[test]
fn every_transaction_schema_entry_has_at_least_one_vector() {
    let matrix = matrix::compute();
    let bare: Vec<String> = matrix
        .transactions
        .iter()
        .filter(|row| row.vectors == 0)
        .map(|row| format!("{:?} v{}", row.tag, row.version))
        .collect();
    assert!(bare.is_empty(), "schema entries with no vector: {bare:?}");
}

#[test]
fn every_fate_vector_decodes_and_re_encodes_to_the_committed_bytes() {
    let matrix = matrix::compute();
    assert!(
        matrix.fate.failures.is_empty(),
        "{} FATE vectors diverge from {}:\n{}",
        matrix.fate.failures.len(),
        matrix.references.aepp_calldata,
        matrix.fate.failures.join("\n")
    );
    // Per class, because the two are different claims. The reference-written
    // half says this crate agrees with `aepp-calldata`; the twinned half says it
    // agrees with an ordering rule stated here. Asserting a merged total would
    // let one make up for the other.
    assert_eq!(
        matrix.fate.reference_roundtrip_pass,
        matrix.fate.reference_vectors
    );
    assert_eq!(
        matrix.fate.twinned_roundtrip_pass,
        matrix.fate.twinned_vectors
    );
}

/// Every committed corpus is counted, per file and per class, pinned exactly.
///
/// The number this replaced was `113`, at a head carrying 636 committed vectors,
/// and it was rendered as `113 | 113` — fully covered. A count that only ever
/// moves in the diff is the point: a corpus growing is as reviewable an event as
/// a corpus shrinking.
#[test]
fn the_fate_corpora_are_counted_per_file_and_per_class() {
    let matrix = matrix::compute();
    let rows: Vec<(String, &'static str, usize, usize)> = matrix
        .fate
        .corpora
        .iter()
        .map(|row| {
            (
                row.file.clone(),
                row.provenance.label(),
                row.vectors,
                row.roundtrip_pass,
            )
        })
        .collect();

    assert_eq!(
        rows,
        vec![
            (
                "aepp-calldata-1.9.1.json".to_string(),
                "reference-written",
                113,
                113
            ),
            (
                "aepp-calldata-1.9.1-sweep.json".to_string(),
                "reference-written",
                521,
                521
            ),
            (
                "aepp-calldata-1.9.1-sweep.json".to_string(),
                "twinned by construction",
                2,
                2
            ),
        ]
    );

    assert_eq!(matrix.fate.reference_vectors, 634);
    assert_eq!(matrix.fate.twinned_vectors, 2);
}

/// Excluding the twinned vectors from variant coverage closes no gap, and this
/// is what says so rather than a sentence in a document.
///
/// The decision is that a vector this repository assembled may not mark a
/// variant covered. That is right whatever the numbers do — but it is only
/// *free* while every variant those vectors reach is already reached by a
/// reference-written one. The day a twinned vector is the sole evidence for a
/// variant, the exclusion stops being a declined weak claim and becomes a hidden
/// gap, and someone has to decide which it is rather than inherit the answer.
#[test]
fn the_excluded_twinned_vectors_are_the_sole_evidence_for_nothing() {
    let matrix = matrix::compute();

    let sole_value: Vec<&String> = matrix
        .fate
        .twinned_value_variants
        .iter()
        .filter(|variant| !matrix.fate.value_variants_covered.contains(*variant))
        .collect();
    assert!(
        sole_value.is_empty(),
        "value variants only a twinned vector reaches: {sole_value:?} — the \
         exclusion is now hiding a gap, not declining weak evidence"
    );

    let sole_type: Vec<&String> = matrix
        .fate
        .twinned_type_variants
        .iter()
        .filter(|variant| !matrix.fate.type_variants_covered.contains(*variant))
        .collect();
    assert!(
        sole_type.is_empty(),
        "type variants only a twinned vector reaches: {sole_type:?}"
    );

    // Two-sided, like the named-exception test: a twinned corpus that decodes to
    // nothing at all would satisfy the assertions above vacuously.
    assert!(!matrix.fate.twinned_value_variants.is_empty());
}

/// The committed snapshot is the artifact a reviewer reads and a later decision
/// is cited against. If it can drift from the code that produced it, it is a
/// document about a state of the world that may never have existed.
#[test]
fn the_committed_matrix_is_the_one_this_code_produces() {
    let computed = matrix::compute();
    let expected_json = format!(
        "{}\n",
        serde_json::to_string_pretty(&computed.to_json()).expect("serialises")
    );
    let expected_markdown = render::markdown(&computed);

    let directory = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
    let committed_json = std::fs::read_to_string(directory.join("matrix.json"))
        .expect("matrix.json is committed; run `cargo run -p ae-parity -- matrix`");
    let committed_markdown = std::fs::read_to_string(directory.join("MATRIX.md"))
        .expect("MATRIX.md is committed; run `cargo run -p ae-parity -- matrix`");

    assert_eq!(
        committed_json, expected_json,
        "matrix.json is stale; run `cargo run -p ae-parity -- matrix`"
    );
    assert_eq!(
        committed_markdown, expected_markdown,
        "MATRIX.md is stale; run `cargo run -p ae-parity -- matrix`"
    );
}

/// Every gap this harness measured on the day it was written, pinned.
///
/// None of these is this crate's to fix. Each is a finding handed to the surface
/// that owns it, and each number here is the one a later run is compared against.
#[test]
fn the_recorded_gaps_are_exactly_what_was_reported() {
    let matrix = matrix::compute();

    // No state-tree entry fixture exists anywhere in this repository. Twenty-five
    // pairs, nothing outside this crate has ever agreed with us about their bytes,
    // and two of them the reference sdk cannot speak for at all.
    assert_eq!(matrix.entries.len(), 25);
    assert_eq!(
        matrix.entries.iter().filter(|row| row.fixtures > 0).count(),
        0
    );

    // The fee is a fixed point: the reference re-serialises the whole transaction
    // to derive its minimum, then validates against it. The generator writes the
    // derived answer back into every vector, so no committed vector ever enters
    // that loop — and a divergence in our derivation cannot fail the suite.
    let unexercised: Vec<String> = matrix
        .transactions
        .iter()
        .filter(|row| row.fee_fixed_point_unexercised)
        .map(|row| format!("{:?} v{}", row.tag, row.version))
        .collect();
    assert_eq!(
        unexercised.len(),
        25,
        "fee fixed point unexercised on: {unexercised:?}"
    );

    // Three FATE value variants and one type variant have no vector at all —
    // unchanged by the sweep corpus entering the matrix, which is measured
    // rather than assumed: neither generator's table reaches them. So this stays
    // a gap in the corpora rather than in either implementation — but an encoder
    // nothing has ever checked is an encoder nobody has checked.
    assert_eq!(
        matrix.fate.value_variants_uncovered,
        vec![
            "StoreMap".to_string(),
            "ContractBytearray".to_string(),
            "Typerep".to_string(),
        ]
    );
    assert_eq!(
        matrix.fate.type_variants_uncovered,
        vec!["ContractBytearray".to_string()]
    );

    // Twenty-four of the two hundred transaction schema fields are never set by
    // any vector. Their codecs mostly run elsewhere; what is untested is this
    // field at this tag, which is where a transcription error in the schema
    // table lives.
    assert_eq!(matrix.fields_total, 200);
    assert_eq!(matrix.fields_exercised, 176);

    // Every field codec runs at least once, so no whole codec is dark.
    assert!(
        matrix.unexercised_codecs.is_empty(),
        "field codecs no vector exercises: {:?}",
        matrix.unexercised_codecs
    );
}

/// The non-postable set, pinned exactly.
///
/// This is the offline half of clause 6: the corpus's own claim about which
/// vectors a node refuses and why. It cannot check that claim against a node —
/// that is `node-exercise.mjs`, which re-measures every one of these on each run
/// and fails in either direction. What it does check is that the claim is
/// well-formed: every marking names a rule and an error code, and every marking
/// either names a postable sibling that exists or is a declared exception.
#[test]
fn every_non_postable_vector_names_its_rule_and_its_sibling() {
    let matrix = matrix::compute();
    let corpus = ae_parity::corpus::transactions();
    let names: Vec<&str> = corpus.iter().map(|case| case.name.as_str()).collect();

    let refusals: Vec<&matrix::VectorRefusal> = matrix
        .transactions
        .iter()
        .flat_map(|row| row.refusals.iter())
        .collect();

    assert_eq!(
        refusals
            .iter()
            .map(|refusal| refusal.vector.as_str())
            .collect::<Vec<_>>(),
        vec![
            "name update v2, id pointer",
            "channel create, with delegates",
            "channel force progress",
        ],
        "the non-postable set changed; re-run the on-node exercise before editing this"
    );

    for refusal in &refusals {
        assert!(
            !refusal.error_code.is_empty() && !refusal.rule.is_empty(),
            "{} is marked non-postable without naming a code and a rule",
            refusal.vector
        );
        if let Some(sibling) = &refusal.sibling {
            assert!(
                names.contains(&sibling.as_str()),
                "{} names sibling {sibling}, which is not in the corpus",
                refusal.vector
            );
        }
    }
}

/// `ChannelForceProgressTx` has no accepted vector at all, and that is a named
/// exception rather than a pass.
///
/// Seven variants — crossing payload signedness, update-entry validity and
/// off-chain-trees validity — were refused identically. The tag is reachable
/// through the generic builder today, so this is a finding against the tag.
///
/// The assertion is deliberately two-sided. Removing the exception without
/// giving the tag a postable vector fails here, and giving it one without
/// removing the exception fails here too — which is what stops it becoming a
/// silent pass in either direction.
#[test]
fn the_named_exception_is_exactly_channel_force_progress() {
    let matrix = matrix::compute();
    assert_eq!(
        matrix.named_exceptions,
        vec!["ChannelForceProgressTx".to_string()]
    );

    for row in &matrix.transactions {
        let declared = matrix.named_exceptions.contains(&format!("{:?}", row.tag));
        assert_eq!(
            declared,
            row.postable_vectors == 0,
            "{:?} v{}: declared exception = {declared}, but it has {} postable vectors",
            row.tag,
            row.version,
            row.postable_vectors
        );
    }
}

/// Both tags that lost a vector to a chain rule kept an acceptance result.
#[test]
fn every_other_refused_tag_still_has_a_postable_vector() {
    let matrix = matrix::compute();
    for row in &matrix.transactions {
        if row.refusals.is_empty() {
            continue;
        }
        let excepted = matrix.named_exceptions.contains(&format!("{:?}", row.tag));
        assert!(
            excepted || row.postable_vectors > 0,
            "{:?} v{} has a refused vector, no postable vector, and no exception",
            row.tag,
            row.version
        );
    }
    assert_eq!(
        matrix
            .transactions
            .iter()
            .map(|row| row.postable_vectors)
            .sum::<usize>(),
        38
    );
}
