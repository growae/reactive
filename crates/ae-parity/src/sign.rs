//! Preparing the corpus for the on-node exercise.
//!
//! The offline half proves we agree with the reference JavaScript sdk. It cannot
//! prove the node agrees with either of us, and the node is the authority: both
//! implementations can be wrong in the same direction, and there are already two
//! known places where the protocol spec and the reference sdk disagree about the
//! state-tree entry schema.
//!
//! So every vector is rebuilt **through this crate**, wrapped in a `SignedTx`
//! signed by a freshly generated key, and handed to `node-exercise.mjs` to post.
//! Rebuilding rather than replaying the corpus string matters: replaying it would
//! exercise the reference's bytes a second time and tell us nothing new.
//!
//! # Why this spends nothing
//!
//! The signing key is generated here, in this process, and is never written down
//! or reused. It has never held a balance on any network. Every transaction is
//! therefore from an account that does not exist on chain, and the node rejects
//! it on state before it can be included in a micro-block. What survives that
//! rejection is the only thing being measured: whether the node's decoder
//! accepted our bytes. Nothing in this repository's history is read, and no key
//! found in it is ever used.

use ae_core::keys::{SecretKey, TxPosition, NETWORK_ID_TESTNET};
use ae_core::tx::{build_tx, build_tx_rlp, BuildOptions, Tag, TxParams, Value};
use serde_json::{json, Value as Json};

use crate::corpus;

/// Build, sign and describe every corpus vector for the on-node exercise.
///
/// # Panics
///
/// If the fresh key cannot be encoded, which would mean the encoding substrate
/// is broken and every other number in this crate is meaningless too.
pub fn signed_corpus(network_id: &str) -> Json {
    let key = SecretKey::generate();
    let address = key.to_address().expect("a generated key encodes");

    let cases: Vec<Json> = corpus::transactions()
        .iter()
        .map(|case| {
            let built = build_tx(&case.params);
            let signed = built.as_ref().ok().and_then(|inner| {
                // A `SignedTx` in the corpus is already a wrapper; signing it
                // again would measure a shape the node never sees.
                if case.tag == Tag::SignedTx {
                    return Some(inner.clone());
                }
                sign(&key, inner, network_id)
            });
            json!({
                "name": case.name,
                "tag": format!("{:?}", case.tag),
                "tag_value": case.tag.as_u32(),
                "built": built.as_ref().ok(),
                "build_error": built.as_ref().err().map(ToString::to_string),
                "signed": signed,
            })
        })
        .collect();

    json!({
        "note": "Generated in-process by `cargo run -p ae-parity -- sign`. \
                 The signing key is generated per run, never persisted, and has \
                 never held a balance. Do not commit this file.",
        "network_id": network_id,
        "signer": address,
        "cases": cases,
    })
}

/// The network id used when none is given.
pub const DEFAULT_NETWORK_ID: &str = NETWORK_ID_TESTNET;

fn sign(key: &SecretKey, encoded_tx: &str, network_id: &str) -> Option<String> {
    let inner_rlp = build_tx_rlp(
        &ae_core::tx::unpack_tx(encoded_tx).ok()?,
        &BuildOptions::default(),
    )
    .ok()?;
    let signature = key.sign_transaction(&inner_rlp, network_id, TxPosition::Outer);
    let mut params = TxParams::new(Tag::SignedTx);
    params.set(
        "signatures",
        Value::List(vec![Value::Bytes(signature.as_bytes().to_vec())]),
    );
    params.set("encodedTx", Value::Encoded(encoded_tx.to_string()));
    build_tx(&params).ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_vector_is_signed_or_says_why_not() {
        let out = signed_corpus(DEFAULT_NETWORK_ID);
        let cases = out["cases"].as_array().expect("cases");
        assert_eq!(cases.len(), corpus::transactions().len());
        for case in cases {
            assert!(
                case["signed"].is_string() || case["build_error"].is_string(),
                "{} produced neither a signed transaction nor a reason",
                case["name"]
            );
        }
    }

    /// Two runs must not produce the same signer. A fixed key here would be key
    /// material committed to the repository by a different route.
    #[test]
    fn the_signing_key_is_fresh_every_run() {
        let first = signed_corpus(DEFAULT_NETWORK_ID);
        let second = signed_corpus(DEFAULT_NETWORK_ID);
        assert_ne!(first["signer"], second["signer"]);
    }
}
