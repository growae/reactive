//! The reachability gate: a committed corpus nobody reads is a corpus that does
//! not exist.
//!
//! This is the defect class rather than the defect. `crates/ae-parity` reported
//! 113 FATE vectors while 636 were committed, and nothing was broken — one
//! `include_str!` named one file, a second corpus was added beside it, and the
//! matrix went on reporting the first. The number was true. It was true about a
//! file, and it was read as true about the crate.
//!
//! Adding a corpus costs one file and no code. That is the property that makes
//! this recur, so the fix is not a corrected count — it is that a corpus in the
//! committed vector directory which no measurement reaches now fails the build,
//! by name, saying where to list it.
//!
//! Two things have to reach a corpus, and both are checked here:
//!
//! - the **matrix**, so its vectors are measured;
//! - `regenerate.mjs`, so clause 5 covers it and its bytes are still the bytes
//!   the pinned reference produces. A corpus in the matrix but not in the drift
//!   check is measured forever against a snapshot nobody re-earns.

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use ae_parity::corpus::FATE_CORPORA;
use ae_parity::matrix;

/// Where the FATE corpora are committed.
fn vector_directory() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("ae-fate")
        .join("tests")
        .join("vectors")
}

/// Every `*.json` in the committed vector directory, by file name.
fn committed_corpora() -> BTreeSet<String> {
    let directory = vector_directory();
    let entries = std::fs::read_dir(&directory)
        .unwrap_or_else(|error| panic!("cannot read {}: {error}", directory.display()));

    let mut files = BTreeSet::new();
    for entry in entries {
        let path = entry.expect("directory entry").path();
        if path.extension().and_then(|extension| extension.to_str()) == Some("json") {
            files.insert(
                path.file_name()
                    .expect("a file")
                    .to_string_lossy()
                    .into_owned(),
            );
        }
    }
    assert!(
        !files.is_empty(),
        "no corpus found in {} — this gate would pass vacuously",
        directory.display()
    );
    files
}

/// The list in `corpus.rs` is the whole of what the matrix can see, so it has to
/// name every committed corpus and nothing that is not committed.
#[test]
fn every_committed_fate_corpus_is_listed_in_the_crate() {
    let committed = committed_corpora();
    let listed: BTreeSet<String> = FATE_CORPORA
        .iter()
        .map(|corpus| corpus.file.to_string())
        .collect();

    let unread: Vec<&String> = committed.difference(&listed).collect();
    assert!(
        unread.is_empty(),
        "committed corpora no measurement reaches: {unread:?}\n\
         Add each to `FATE_CORPORA` in `crates/ae-parity/src/corpus.rs`, then \
         re-run `cargo run -p ae-parity -- matrix`."
    );

    let missing: Vec<&String> = listed.difference(&committed).collect();
    assert!(
        missing.is_empty(),
        "listed corpora that are not committed in {}: {missing:?}",
        vector_directory().display()
    );
}

/// Listing a corpus is not reading it. This asserts the matrix actually produced
/// a row for every one, which is the property the count was wrong about.
#[test]
fn every_committed_fate_corpus_has_a_row_in_the_matrix() {
    let matrix = matrix::compute();
    let measured: BTreeSet<String> = matrix
        .fate
        .corpora
        .iter()
        .map(|row| row.file.clone())
        .collect();

    for file in committed_corpora() {
        assert!(
            measured.contains(&file),
            "{file} is committed but contributes no row to the matrix"
        );
    }
    for row in &matrix.fate.corpora {
        assert!(
            row.vectors > 0,
            "{} [{}] is a row with no vectors",
            row.file,
            row.provenance.label()
        );
    }
}

/// Clause 5 — "regenerating every committed corpus at its pinned reference version
/// produces no diff" — is only worth its wording while the drift script covers
/// every corpus the matrix scores. It did not: the sweep was measured by
/// `ae-fate`'s own tests and re-derived by nothing.
///
/// A text check, deliberately. The alternative is running the script, which
/// reaches the npm registry, and the offline gate must not depend on that — the
/// parity workflow keeps the drift job separate for exactly that reason.
#[test]
fn every_committed_fate_corpus_is_named_in_the_drift_script() {
    let script_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("regenerate.mjs");
    let script = std::fs::read_to_string(&script_path)
        .unwrap_or_else(|error| panic!("cannot read {}: {error}", script_path.display()));

    for file in committed_corpora() {
        assert!(
            script.contains(&file),
            "{file} is committed but `regenerate.mjs` never regenerates it, so \
             nothing re-earns its bytes against the pinned reference"
        );
    }
}
