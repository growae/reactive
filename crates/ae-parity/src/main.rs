//! The harness command line.
//!
//! ```text
//! cargo run -p ae-parity -- matrix [--node <path>] [--out <dir>]
//! cargo run -p ae-parity -- sign [--network-id <id>] [--out <path>]
//! ```
//!
//! `matrix` writes `MATRIX.md` and `matrix.json` into `--out`, defaulting to the
//! crate directory so that the committed snapshot and a fresh run are the same
//! command. CI runs it and fails on any diff, which is what makes a coverage
//! change show up in review rather than in a summary nobody reads.

use std::path::{Path, PathBuf};
use std::process::ExitCode;

use ae_parity::{matrix, render, sign};

fn main() -> ExitCode {
    let arguments: Vec<String> = std::env::args().skip(1).collect();
    let command = arguments.first().map(String::as_str);
    match command {
        Some("matrix") => run_matrix(&arguments[1..]),
        Some("sign") => run_sign(&arguments[1..]),
        _ => {
            eprintln!("usage: ae-parity <matrix|sign> [options]");
            eprintln!("  matrix [--node <path>] [--out <dir>]");
            eprintln!("  sign   [--network-id <id>] [--out <path>]");
            ExitCode::FAILURE
        }
    }
}

fn run_matrix(arguments: &[String]) -> ExitCode {
    let out = flag(arguments, "--out")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(env!("CARGO_MANIFEST_DIR")));

    let mut computed = matrix::compute();
    if let Some(path) = flag(arguments, "--node") {
        match std::fs::read_to_string(&path)
            .map_err(|error| error.to_string())
            .and_then(|text| serde_json::from_str(&text).map_err(|error| error.to_string()))
        {
            Ok(node) => computed.node = Some(node),
            Err(error) => {
                eprintln!("could not read {path}: {error}");
                return ExitCode::FAILURE;
            }
        }
    }

    let json = format!(
        "{}\n",
        serde_json::to_string_pretty(&computed.to_json()).expect("the matrix serialises")
    );
    if let Err(error) = write(&out.join("matrix.json"), &json) {
        eprintln!("{error}");
        return ExitCode::FAILURE;
    }
    if let Err(error) = write(&out.join("MATRIX.md"), &render::markdown(&computed)) {
        eprintln!("{error}");
        return ExitCode::FAILURE;
    }

    println!(
        "matrix written to {} ({} of {} schema entries green, {} of {} fields exercised)",
        out.display(),
        computed
            .transactions
            .iter()
            .filter(|row| row.is_green())
            .count(),
        computed.transactions.len(),
        computed.fields_exercised,
        computed.fields_total
    );
    ExitCode::SUCCESS
}

fn run_sign(arguments: &[String]) -> ExitCode {
    let network_id =
        flag(arguments, "--network-id").unwrap_or_else(|| sign::DEFAULT_NETWORK_ID.to_string());
    let out = flag(arguments, "--out").unwrap_or_else(|| "signed.json".to_string());
    let corpus = sign::signed_corpus(&network_id);
    let text = format!(
        "{}\n",
        serde_json::to_string_pretty(&corpus).expect("the signed corpus serialises")
    );
    if let Err(error) = write(Path::new(&out), &text) {
        eprintln!("{error}");
        return ExitCode::FAILURE;
    }
    println!("signed corpus written to {out} for {network_id}");
    ExitCode::SUCCESS
}

fn flag(arguments: &[String], name: &str) -> Option<String> {
    let index = arguments.iter().position(|argument| argument == name)?;
    arguments.get(index + 1).cloned()
}

fn write(path: &Path, contents: &str) -> Result<(), String> {
    std::fs::write(path, contents)
        .map_err(|error| format!("could not write {}: {error}", path.display()))
}
