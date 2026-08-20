//! Parity against the chain, not against a second implementation.
//!
//! `vectors/transactions.json` proves this crate agrees with `@aeternity/aepp-sdk`.
//! That leaves the failure mode where both implementations agree and are both
//! wrong, and it says nothing about whether a node would accept what we build.
//! This corpus closes that: every case is a transaction a node **already
//! accepted and mined**, harvested from the middleware on mainnet and testnet,
//! carrying the node's own decoding of it and the signatures it was included
//! with.
//!
//! What that buys, in the order the tests below assert it:
//!
//! 1. **Serialisation** — decode the mined bytes and re-encode them; a single
//!    byte of divergence is a transaction a node would have rejected.
//! 2. **The transaction hash** — ours against the `th_` the chain indexed it by.
//! 3. **The network-id prefix rule** — real signatures over real transactions
//!    verify under their own network id and under no other. This is the check
//!    that cannot be faked offline: a signature that round-trips locally and is
//!    rejected on chain is exactly what a wrong prefix produces, and every
//!    signature here is one a node verified.
//! 4. **The inner-transaction suffix** — `PayingForTx` and `GaMetaTx` wrap a
//!    `SignedTx` whose signature is taken over `network_id ++ "-inner_tx"`.
//!    Those are mined too, so the suffix is proven rather than assumed.
//! 5. **Field agreement with the node's own decoder**, so a byte-identical
//!    re-encode is not resting on us and the SDK sharing a misreading.
//! 6. **The fee model against fees a node accepted** — the part an offline
//!    byte-diff structurally cannot reach.
//!
//! The corpus is public chain data. No key material is read, written or
//! referenced here: every signature is verified with a public key that is
//! already on chain, and nothing in this file signs anything.
//!
//! Regenerating it is a harvest from the middleware, and the diff is the record
//! of what the chain started doing differently.
//!
//! # Two signing payloads: we accept both, we emit one
//!
//! The chain says something here that no offline corpus could. A node verifies a
//! transaction signature against **either** of two payloads —
//! `aetx_sign:signed_payloads/3` builds both and falls back from the first to the
//! second:
//!
//! ```text
//! plain   network_id [ "-inner_tx" ] ++ tx_bytes                accepted at every protocol
//! hashed  network_id [ "-inner_tx" ] ++ blake2b_256(tx_bytes)   accepted from Lima (4) on
//! ```
//!
//! [`ae_core::keys`] **signs** the hashed payload and nothing else, matching
//! `@aeternity/aepp-sdk`, and [`ae_core::keys::PublicKey::verify_transaction`]
//! **accepts both**, matching the node. That asymmetry is the rule, not an
//! oversight: widening what we accept was never licence to widen what we emit.
//!
//! The corpus keeps counting the split even though the verifier no longer cares.
//! The plain population is the 26% the verifier used to reject, and it is the
//! only thing that would notice if the widening were ever backed out — so
//! closing the gap does not get to cost the observability that found it.

use ae_core::encoding::{decode, encode, Encoding};
use ae_core::fee::{minimum_transaction_fee, TxGasInputs};
use ae_core::keys::{
    transaction_signing_payload, PublicKey, Signature, TxPosition, NETWORK_ID_MAINNET,
    NETWORK_ID_TESTNET,
};
use ae_core::protocol::{AbiVersion, ConsensusProtocolVersion};
use ae_core::tx::{
    build_tx, build_tx_rlp, transaction_hash, unpack_tx, BuildOptions, Tag, TxParams, Value,
};
use serde_json::Value as Json;
use std::collections::{BTreeMap, BTreeSet};

const CORPUS: &str = include_str!("vectors/chain.json");

/// The protocol version this crate has constants for. Cases mined under an
/// earlier one still exercise every test except the fee model.
const CERES: u64 = 6;

struct Case {
    network_id: String,
    height: u64,
    protocol: u64,
    hash: String,
    signed_tx: String,
    signatures: Vec<String>,
    node: BTreeMap<String, Json>,
}

impl Case {
    /// The network id this case was *not* mined on — the negative control for
    /// every signature check.
    fn other_network_id(&self) -> &'static str {
        if self.network_id == NETWORK_ID_TESTNET {
            NETWORK_ID_MAINNET
        } else {
            NETWORK_ID_TESTNET
        }
    }

    fn label(&self) -> String {
        format!("{} {} @{}", self.network_id, self.hash, self.height)
    }
}

fn corpus() -> Vec<Case> {
    let json: Json = serde_json::from_str(CORPUS).expect("corpus is valid json");
    let cases = json["cases"].as_array().expect("cases is an array");
    assert!(!cases.is_empty(), "the corpus is empty");
    cases
        .iter()
        .map(|case| Case {
            network_id: case["networkId"].as_str().unwrap().to_string(),
            height: case["height"].as_u64().unwrap(),
            protocol: case["protocol"].as_u64().unwrap(),
            hash: case["hash"].as_str().unwrap().to_string(),
            signed_tx: case["signedTx"].as_str().unwrap().to_string(),
            signatures: case["signatures"]
                .as_array()
                .unwrap()
                .iter()
                .map(|s| s.as_str().unwrap().to_string())
                .collect(),
            node: case["node"]
                .as_object()
                .unwrap()
                .iter()
                .map(|(k, v)| (k.clone(), v.clone()))
                .collect(),
        })
        .collect()
}

/// The transaction a `SignedTx` wraps, and the signatures over it.
fn signed_parts(params: &TxParams) -> (&TxParams, Vec<Signature>) {
    assert_eq!(params.tag(), Tag::SignedTx, "corpus case is not a SignedTx");
    let inner = params
        .get("encodedTx")
        .and_then(Value::as_tx)
        .expect("a SignedTx carries a transaction");
    let signatures = match params.get("signatures") {
        Some(Value::List(items)) => items
            .iter()
            .map(|item| {
                let bytes: [u8; 64] = item
                    .as_bytes()
                    .expect("a signature is raw bytes")
                    .try_into()
                    .expect("a signature is 64 bytes");
                Signature::from_bytes(bytes)
            })
            .collect(),
        _ => Vec::new(),
    };
    (inner, signatures)
}

/// Every `ak_` address the transaction names, at one level of nesting.
///
/// The signer of a transaction is always one of the accounts it names — the
/// account whose nonce it spends, or, for a channel transaction, one of the two
/// parties. Collecting them all and asking which one a signature belongs to
/// avoids hard-coding a per-tag signer field that the schema already encodes.
fn named_accounts(params: &TxParams) -> BTreeSet<String> {
    let mut out = BTreeSet::new();
    collect_accounts(params, &mut out, 2);
    out
}

fn collect_accounts(params: &TxParams, out: &mut BTreeSet<String>, depth: usize) {
    for value in params.fields().values() {
        collect_from_value(value, out, depth);
    }
}

fn collect_from_value(value: &Value, out: &mut BTreeSet<String>, depth: usize) {
    match value {
        Value::Encoded(s) if s.starts_with("ak_") => {
            out.insert(s.clone());
        }
        // An oracle's id is its account's public key under a different prefix,
        // and an `OracleExtendTx` or `OracleRespondTx` names the signer only that
        // way — the account address never appears in the transaction.
        Value::Encoded(s) if s.starts_with("ok_") => {
            if let Ok(address) = decode(s).and_then(|raw| encode(&raw, Encoding::AccountAddress)) {
                out.insert(address);
            }
        }
        Value::List(items) => items
            .iter()
            .for_each(|item| collect_from_value(item, out, depth)),
        Value::Tx(inner) if depth > 0 => collect_accounts(inner, out, depth - 1),
        _ => {}
    }
}

fn rlp_of(params: &TxParams) -> Vec<u8> {
    build_tx_rlp(params, &BuildOptions::default()).expect("a decoded transaction re-serialises")
}

/// One of the two payloads a node will verify a transaction signature against.
///
/// `keys::PublicKey::verify_transaction` accepts both and does not say which
/// matched — deliberately, since no consumer has a use for the distinction and a
/// type reporting it would be a permanent mirror in every binding. This corpus
/// does have a use for it: the plain population is what the verifier used to
/// reject, and it stays counted so that closing the gap did not cost the
/// observability that found it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum Payload {
    /// `network_id [ "-inner_tx" ] ++ blake2b_256(tx)` — what this crate signs,
    /// and what `@aeternity/aepp-sdk` produces.
    Hashed,
    /// `network_id [ "-inner_tx" ] ++ tx` — accepted at every protocol version,
    /// and what the node's own channel FSM produces. This crate never signs it.
    Plain,
}

/// The plain payload, built here rather than taken from `keys`, which keeps it
/// private so that nothing can accidentally sign one.
fn plain_payload(rlp: &[u8], network_id: &str, position: TxPosition) -> Vec<u8> {
    let mut payload = network_id.as_bytes().to_vec();
    if position == TxPosition::Inner {
        payload.extend_from_slice(b"-inner_tx");
    }
    payload.extend_from_slice(rlp);
    payload
}

/// Whether any account the transaction names produced this signature, and under
/// which of the two payloads.
///
/// Discriminates by checking each payload explicitly, because
/// `verify_transaction` accepts both and would report every signature as one
/// kind. Each match is then cross-checked against `verify_transaction`, which is
/// the property that matters: whatever a node accepts, we accept.
fn signer_of(
    accounts: &BTreeSet<String>,
    rlp: &[u8],
    network_id: &str,
    position: TxPosition,
    signature: &Signature,
) -> Option<(String, Payload)> {
    accounts.iter().find_map(|address| {
        let key = PublicKey::from_address(address).ok()?;
        let payload = if key.verify(
            &transaction_signing_payload(rlp, network_id, position),
            signature,
        ) {
            Payload::Hashed
        } else if key.verify(&plain_payload(rlp, network_id, position), signature) {
            Payload::Plain
        } else {
            return None;
        };
        assert!(
            key.verify_transaction(rlp, network_id, position, signature),
            "{address}: a {payload:?}-payload signature a node accepts was rejected by \
             verify_transaction"
        );
        Some((address.clone(), payload))
    })
}

// ---------------------------------------------------------------------------
// 1. Serialisation
// ---------------------------------------------------------------------------

#[test]
fn every_mined_transaction_re_encodes_to_the_bytes_the_chain_holds() {
    let mut failures = Vec::new();
    let mut per_tag: BTreeMap<String, usize> = BTreeMap::new();

    for case in corpus() {
        let params = match unpack_tx(&case.signed_tx) {
            Ok(params) => params,
            Err(error) => {
                failures.push(format!("{}: unpack failed: {error}", case.label()));
                continue;
            }
        };
        let (inner, _) = signed_parts(&params);
        *per_tag.entry(format!("{:?}", inner.tag())).or_default() += 1;

        match build_tx(&params) {
            Ok(rebuilt) if rebuilt == case.signed_tx => {}
            Ok(rebuilt) => failures.push(format!(
                "{}\n  chain {}\n  ours  {}",
                case.label(),
                case.signed_tx,
                rebuilt
            )),
            Err(error) => failures.push(format!("{}: rebuild failed: {error}", case.label())),
        }
    }

    assert!(
        failures.is_empty(),
        "{} mined transactions did not re-encode:\n{}",
        failures.len(),
        failures.join("\n")
    );
    eprintln!("re-encoded byte-identical, by wrapped tag: {per_tag:?}");
}

#[test]
fn every_mined_transaction_hashes_to_the_th_the_chain_indexed_it_by() {
    let mut failures = Vec::new();
    for case in corpus() {
        match transaction_hash(&case.signed_tx) {
            Ok(hash) if hash == case.hash => {}
            Ok(hash) => failures.push(format!("{}: we make it {hash}", case.label())),
            Err(error) => failures.push(format!("{}: {error}", case.label())),
        }
    }
    assert!(
        failures.is_empty(),
        "{} transaction hashes diverged:\n{}",
        failures.len(),
        failures.join("\n")
    );
}

#[test]
fn the_signatures_we_decode_are_the_ones_the_chain_reports() {
    for case in corpus() {
        let params = unpack_tx(&case.signed_tx).unwrap();
        let (_, signatures) = signed_parts(&params);
        let ours: Vec<String> = signatures.iter().map(|s| s.to_encoded().unwrap()).collect();
        assert_eq!(ours, case.signatures, "{}", case.label());
    }
}

// ---------------------------------------------------------------------------
// 2. The network-id prefix rule, against signatures a node verified
// ---------------------------------------------------------------------------

#[test]
fn every_mined_signature_verifies_under_its_own_network_id_and_under_no_other() {
    let mut checked = 0usize;
    let mut by_payload: BTreeMap<Payload, usize> = BTreeMap::new();
    let mut unattributed: BTreeMap<String, usize> = BTreeMap::new();
    let mut cross_network = Vec::new();
    let mut wrong_position = Vec::new();

    for case in corpus() {
        let params = unpack_tx(&case.signed_tx).unwrap();
        let (inner, signatures) = signed_parts(&params);
        let accounts = named_accounts(inner);
        let rlp = rlp_of(inner);

        for signature in &signatures {
            checked += 1;
            match signer_of(
                &accounts,
                &rlp,
                &case.network_id,
                TxPosition::Outer,
                signature,
            ) {
                Some((_, payload)) => *by_payload.entry(payload).or_default() += 1,
                None => {
                    *unattributed
                        .entry(format!("{:?}", inner.tag()))
                        .or_default() += 1
                }
            }
            // The negative controls, and the point of the whole test. Neither
            // may ever fire: a signature that also verifies for the other
            // network, or as an inner transaction, would mean the prefix binds
            // nothing.
            if signer_of(
                &accounts,
                &rlp,
                case.other_network_id(),
                TxPosition::Outer,
                signature,
            )
            .is_some()
            {
                cross_network.push(case.label());
            }
            if signer_of(
                &accounts,
                &rlp,
                &case.network_id,
                TxPosition::Inner,
                signature,
            )
            .is_some()
            {
                wrong_position.push(case.label());
            }
        }
    }

    assert!(checked > 0, "the corpus carries no signatures");
    assert!(
        cross_network.is_empty(),
        "{} signatures verified under the wrong network id: {cross_network:?}",
        cross_network.len()
    );
    assert!(
        wrong_position.is_empty(),
        "{} outer signatures verified as inner ones: {wrong_position:?}",
        wrong_position.len()
    );

    // Every signature this corpus cannot attribute belongs to a channel
    // counterparty whose account the transaction does not name — a
    // `ChannelDepositTx` carries `fromId` and the channel id and nothing else,
    // yet both parties sign it. Any other tag appearing here is a real failure
    // of the signed payload, not a gap in the corpus.
    let unexpected: Vec<&String> = unattributed
        .keys()
        .filter(|tag| !tag.starts_with("Channel"))
        .collect();
    assert!(
        unexpected.is_empty(),
        "signatures that verify for no account the transaction names, on tags \
         where every signer is named: {unexpected:?}"
    );

    let hashed = by_payload.get(&Payload::Hashed).copied().unwrap_or(0);
    let plain = by_payload.get(&Payload::Plain).copied().unwrap_or(0);
    assert!(
        hashed > 0,
        "no mined signature used the payload this crate signs"
    );
    // Both populations stay pinned now that `verify_transaction` accepts both.
    // `signer_of` asserts the verifier takes whichever one matched, so these two
    // numbers are what makes the widening observable: `plain` is the 26% that
    // used to be rejected, and a corpus where it reached zero would let the
    // widening be backed out without a test noticing.
    assert!(
        plain > 0,
        "the plain payload has vanished from the corpus — the widened verifier \
         is no longer covered by anything; re-read this file's module docs \
         before deleting the counter"
    );
    eprintln!(
        "signatures: {checked} mined, all attributable ones accepted by verify_transaction — \
         {hashed} under the hashed payload this crate signs, {plain} under the plain payload \
         it never signs ({:.1}%), {} unattributable channel counterparties {unattributed:?}",
        100.0 * plain as f64 / (hashed + plain) as f64,
        checked - hashed - plain,
    );
}

#[test]
fn a_wrapped_transaction_is_signed_under_the_inner_suffix() {
    let mut inner_checked = 0usize;
    let mut by_payload: BTreeMap<Payload, usize> = BTreeMap::new();
    let mut failures = Vec::new();

    for case in corpus() {
        let params = unpack_tx(&case.signed_tx).unwrap();
        let (outer, _) = signed_parts(&params);
        if !matches!(outer.tag(), Tag::PayingForTx | Tag::GaMetaTx) {
            continue;
        }
        let Some(wrapped) = outer.get("tx").and_then(Value::as_tx) else {
            failures.push(format!("{}: no wrapped transaction", case.label()));
            continue;
        };
        let (inner, signatures) = signed_parts(wrapped);
        let accounts = named_accounts(inner);
        let rlp = rlp_of(inner);

        for signature in &signatures {
            inner_checked += 1;
            match signer_of(
                &accounts,
                &rlp,
                &case.network_id,
                TxPosition::Inner,
                signature,
            ) {
                Some((_, payload)) => *by_payload.entry(payload).or_default() += 1,
                None => failures.push(format!(
                    "{} {:?}: inner signature verifies for no named account",
                    case.label(),
                    outer.tag()
                )),
            }
            // Without the suffix it must not verify, or the suffix is decorative.
            if signer_of(
                &accounts,
                &rlp,
                &case.network_id,
                TxPosition::Outer,
                signature,
            )
            .is_some()
            {
                failures.push(format!(
                    "{}: inner signature also verifies as an outer one",
                    case.label()
                ));
            }
        }
    }

    assert!(
        inner_checked > 0,
        "no wrapped transaction in the corpus carried a signature"
    );
    assert!(failures.is_empty(), "{}", failures.join("\n"));
    eprintln!(
        "{inner_checked} inner signatures verified under the -inner_tx suffix and \
         under nothing else, by payload {by_payload:?}"
    );
}

// ---------------------------------------------------------------------------
// 3. Agreement with the node's own decoder
// ---------------------------------------------------------------------------

/// Node field name → the schema field name it corresponds to.
const FIELD_MAP: &[(&str, &str)] = &[
    ("abi_version", "abiVersion"),
    ("account_id", "accountId"),
    ("amount", "amount"),
    ("auth_fun", "authFun"),
    ("caller_id", "callerId"),
    ("channel_id", "channelId"),
    ("channel_reserve", "channelReserve"),
    ("commitment_id", "commitmentId"),
    ("contract_id", "contractId"),
    ("deposit", "deposit"),
    ("fee", "fee"),
    ("from_id", "fromId"),
    ("ga_id", "gaId"),
    ("gas", "gasLimit"),
    ("gas_price", "gasPrice"),
    ("initiator_amount", "initiatorAmount"),
    ("initiator_id", "initiator"),
    ("lock_period", "lockPeriod"),
    ("name", "name"),
    ("name_fee", "nameFee"),
    ("name_id", "nameId"),
    ("name_salt", "nameSalt"),
    ("nonce", "nonce"),
    ("oracle_id", "oracleId"),
    ("owner_id", "ownerId"),
    ("payer_id", "payerId"),
    ("payload", "payload"),
    ("query_fee", "queryFee"),
    ("query_id", "queryId"),
    ("recipient_id", "recipientId"),
    ("responder_amount", "responderAmount"),
    ("responder_id", "responder"),
    ("round", "round"),
    ("sender_id", "senderId"),
    ("state_hash", "stateHash"),
    ("to_id", "toId"),
    ("ttl", "ttl"),
];

/// The `{type, value}` TTL objects, and the pair of fields each maps onto.
const TTL_MAP: &[(&str, &str, &str)] = &[
    ("oracle_ttl", "oracleTtlType", "oracleTtlValue"),
    ("query_ttl", "queryTtlType", "queryTtlValue"),
    ("response_ttl", "responseTtlType", "responseTtlValue"),
];

fn ours_as_string(value: &Value) -> Option<String> {
    match value {
        Value::Uint(v) => Some(v.to_string()),
        Value::Encoded(s) | Value::Text(s) => Some(s.clone()),
        _ => None,
    }
}

/// Whether two spellings are the same number.
///
/// The middleware renders an integer past `2^53` in JSON exponent form —
/// `nameFee` comes back as `5.14229e19` — so a string comparison reports a
/// disagreement where there is none. This does not weaken the check: it only
/// applies when the node's own spelling is not an exact integer, which is
/// precisely the case where its JSON has already lost the exact value.
fn same_number(node: &str, ours: &str) -> bool {
    if !node.contains(['e', 'E', '.']) {
        return false;
    }
    match (node.parse::<f64>(), ours.parse::<f64>()) {
        (Ok(node), Ok(ours)) => node == ours,
        _ => false,
    }
}

fn node_as_string(value: &Json) -> Option<String> {
    match value {
        Json::Number(n) => Some(n.to_string()),
        Json::String(s) => Some(s.clone()),
        _ => None,
    }
}

#[test]
fn our_decoding_agrees_with_the_nodes_on_every_field_both_of_us_name() {
    let mut compared = 0usize;
    let mut failures = Vec::new();
    let mut seen_fields: BTreeSet<&str> = BTreeSet::new();

    for case in corpus() {
        let params = unpack_tx(&case.signed_tx).unwrap();
        let (inner, _) = signed_parts(&params);

        if let Some(Json::String(kind)) = case.node.get("type") {
            // The node spells the generalized-account tags `GAAttachTx` and
            // `GAMetaTx`; the reference schema this crate transcribes spells them
            // `GaAttachTx` and `GaMetaTx`. The difference is capitalisation in a
            // display string, not in anything serialised.
            assert_eq!(
                format!("{:?}", inner.tag()).to_lowercase(),
                kind.to_lowercase(),
                "{}: tag disagrees with the node",
                case.label()
            );
        }

        for (node_key, our_key) in FIELD_MAP {
            let (Some(node_value), Some(our_value)) =
                (case.node.get(*node_key), inner.get(our_key))
            else {
                continue;
            };
            let (Some(node_str), Some(our_str)) =
                (node_as_string(node_value), ours_as_string(our_value))
            else {
                continue;
            };
            compared += 1;
            seen_fields.insert(node_key);
            if node_str != our_str && !same_number(&node_str, &our_str) {
                failures.push(format!(
                    "{} {:?}.{node_key}: node {node_str}, ours {our_str}",
                    case.label(),
                    inner.tag()
                ));
            }
        }

        for (node_key, type_key, value_key) in TTL_MAP {
            let Some(Json::Object(ttl)) = case.node.get(*node_key) else {
                continue;
            };
            let (Some(kind), Some(value)) = (ttl.get("type"), ttl.get("value")) else {
                continue;
            };
            let expected_type = match kind.as_str() {
                Some("delta") => 0u64,
                Some("block") => 1u64,
                _ => continue,
            };
            compared += 2;
            seen_fields.insert(node_key);
            let ours_type = inner.get(type_key).and_then(Value::as_u64);
            let ours_value = inner.get(value_key).and_then(Value::as_u64);
            if ours_type != Some(expected_type) || ours_value != value.as_u64() {
                failures.push(format!(
                    "{} {:?}.{node_key}: node {kind}/{value}, ours {ours_type:?}/{ours_value:?}",
                    case.label(),
                    inner.tag()
                ));
            }
        }
    }

    assert!(
        failures.is_empty(),
        "{} field disagreements with the node's own decoder:\n{}",
        failures.len(),
        failures.join("\n")
    );
    assert!(compared > 500, "only {compared} fields compared");
    eprintln!(
        "{compared} field values agreed with the node, across {} distinct fields",
        seen_fields.len()
    );
}

// ---------------------------------------------------------------------------
// 4. The fee model against fees a node accepted
// ---------------------------------------------------------------------------

/// What the crate's own join answers for a mined transaction.
///
/// This used to be `MinedTx`, a `RebuildTx` written here because `ae_core`
/// shipped both halves of the fee seam and nothing that joined them. It read the
/// ABI off the decoded transaction by hand, and the note next to it said that a
/// binding author who forgot that step would over-price every FATE contract call
/// by 2.5x — silently, because a fee above the minimum is accepted.
///
/// [`minimum_transaction_fee`] is that join, in `src`. The corpus now drives the
/// shipped code rather than proving a bridge nothing ships, which is the only
/// version of this test worth having: a hand-written copy here would keep passing
/// while every binding did something else.
///
/// It is also the reason the numbers below do not move. Every mined transaction
/// carries `abiVersion` explicitly, so the wire and the params map agree on all
/// of them — which is exactly why this corpus could never have found the defect
/// the join exists to prevent, and why that case is pinned in `fee`'s own tests
/// instead.
fn model_minimum(inner: &TxParams) -> ae_core::Result<u128> {
    minimum_transaction_fee(ConsensusProtocolVersion::Ceres, inner)
}

/// Whether an oracle transaction states its ttl as an absolute block height.
///
/// The join refuses to price one: the gas formula charges for the *relative*
/// ttl, and recovering it needs the current height, which is a node lookup this
/// crate does not do. The corpus is checked for these rather than silently
/// skipping them, so "the error arm never fires here" stays a measured fact
/// about the chain instead of an assumption about it.
fn has_absolute_oracle_ttl(params: &TxParams) -> bool {
    let type_key = match params.tag() {
        Tag::OracleRegisterTx | Tag::OracleExtendTx => "oracleTtlType",
        Tag::OracleQueryTx => "queryTtlType",
        Tag::OracleRespondTx => "responseTtlType",
        _ => return false,
    };
    params.get(type_key).and_then(Value::as_u64).unwrap_or(0) != 0
}

/// How far above the model's minimum the chain's own fees sat, per tag.
///
/// A tag where every real fee sits well above the minimum is the shape that
/// hides an under-charging model: nothing on chain would have caught it.
#[derive(Default, Debug)]
struct Margin {
    cases: usize,
    exact: usize,
    /// The largest `actual / minimum` seen, to one decimal place.
    worst_ratio_tenths: u128,
}

impl Margin {
    fn note_margin(&mut self, actual: u128, minimum: u128) {
        if let Some(ratio) = (actual * 10).checked_div(minimum) {
            self.worst_ratio_tenths = self.worst_ratio_tenths.max(ratio);
        }
    }
}

#[test]
fn no_fee_a_node_accepted_is_below_what_the_model_asks_for() {
    let mut checked = 0usize;
    let mut exact = 0usize;
    let mut below = Vec::new();
    let mut skipped: BTreeMap<&str, usize> = BTreeMap::new();
    let mut exact_by_tag: BTreeMap<String, Margin> = BTreeMap::new();

    for case in corpus() {
        if case.protocol != CERES {
            *skipped
                .entry("mined under an earlier protocol")
                .or_default() += 1;
            continue;
        }
        let params = unpack_tx(&case.signed_tx).unwrap();
        let (inner, _) = signed_parts(&params);
        let Some(actual) = inner.get("fee").and_then(Value::as_uint) else {
            *skipped.entry("no fee field").or_default() += 1;
            continue;
        };
        if has_absolute_oracle_ttl(inner) {
            *skipped
                .entry("oracle ttl stated as an absolute block height")
                .or_default() += 1;
            continue;
        }
        let minimum = match model_minimum(inner) {
            Ok(minimum) => minimum,
            Err(error) => {
                below.push(format!("{}: model errored: {error}", case.label()));
                continue;
            }
        };

        checked += 1;
        let entry = exact_by_tag
            .entry(format!("{:?}", inner.tag()))
            .or_default();
        entry.cases += 1;

        let actual = actual.to_string().parse::<u128>().expect("a fee fits u128");
        if actual == minimum {
            exact += 1;
            entry.exact += 1;
        } else if actual < minimum {
            below.push(format!(
                "{} {:?}: chain accepted {actual}, model demands {minimum}",
                case.label(),
                inner.tag()
            ));
        } else {
            entry.note_margin(actual, minimum);
        }
    }

    assert!(checked > 100, "only {checked} fees checked");
    assert!(
        below.is_empty(),
        "{} of {checked} fees a node accepted are below what the model demands — \
         the model would have refused a transaction the chain took:\n{}",
        below.len(),
        below.join("\n")
    );
    eprintln!(
        "fees: {checked} checked, {exact} exactly at the model's minimum, \
         {} above it; skipped {skipped:?}; by tag {exact_by_tag:?}",
        checked - exact
    );
}

/// A contract call's base gas, held against the node's own table rather than
/// against `@aeternity/aepp-sdk`.
///
/// `aec_governance:tx_base_gas/3`:
///
/// ```erlang
/// tx_base_gas(contract_call_tx, _Protocol, ABI) ->
///     case ABI of
///         ?ABI_FATE_SOPHIA_1 -> 12 * ?TX_BASE_GAS;
///         ?ABI_AEVM_SOPHIA_1 -> 30 * ?TX_BASE_GAS;
///         _                  -> 30 * ?TX_BASE_GAS      %% Max gas
///     end;
/// ```
///
/// The SDK keys `TX_BASE_GAS` on the tag alone and answers `12×` for all three,
/// so this is where the two corpora part company and the node wins: parity with
/// the SDK was only ever a proxy for *a node will accept this*. The failure is
/// one-directional — too low is `too_low_fee` and a rejected transaction, too
/// high is accepted — so the unknown arm takes the dearer answer.
///
/// The chain corpus cannot police this on its own: every mined contract call in
/// it is FATE. That is why the numbers are asserted directly.
#[test]
fn a_contract_call_is_priced_by_the_nodes_abi_table() {
    use ae_core::fee::transaction_base_gas;

    const FATE: u64 = 12 * 15_000;
    const AEVM_OR_UNKNOWN: u64 = 30 * 15_000;

    let base_gas = |abi_version| {
        transaction_base_gas(
            ConsensusProtocolVersion::Ceres,
            TxGasInputs {
                abi_version,
                ..TxGasInputs::new(Tag::ContractCallTx, 0)
            },
        )
    };

    assert_eq!(base_gas(Some(AbiVersion::Fate)), FATE);
    assert_eq!(base_gas(Some(AbiVersion::Sophia)), AEVM_OR_UNKNOWN);
    assert_eq!(base_gas(Some(AbiVersion::NoAbi)), AEVM_OR_UNKNOWN);
    // "The caller did not say" takes the node's `_` arm, not the FATE one.
    assert_eq!(base_gas(None), AEVM_OR_UNKNOWN);

    // The node keys three more tags on the ABI and answers `5×` on every arm of
    // each, so the divergence was this one tag and no other. Nothing changed for
    // them, and nothing may.
    for tag in [Tag::ContractCreateTx, Tag::GaAttachTx, Tag::GaMetaTx] {
        for abi_version in [
            None,
            Some(AbiVersion::Fate),
            Some(AbiVersion::Sophia),
            Some(AbiVersion::NoAbi),
        ] {
            assert_eq!(
                transaction_base_gas(
                    ConsensusProtocolVersion::Ceres,
                    TxGasInputs {
                        abi_version,
                        ..TxGasInputs::new(tag, 0)
                    }
                ),
                5 * 15_000,
                "{tag} is 5x at every ABI on the node, and must be 5x here"
            );
        }
    }
}

// ---------------------------------------------------------------------------
// 5. What the corpus actually reaches
// ---------------------------------------------------------------------------

#[test]
fn the_corpus_reports_which_tags_the_chain_could_show_us() {
    let mut reached: BTreeSet<(u32, u32)> = BTreeSet::new();
    let mut by_tag: BTreeMap<String, usize> = BTreeMap::new();
    let mut networks: BTreeSet<String> = BTreeSet::new();

    for case in corpus() {
        networks.insert(case.network_id.clone());
        let params = unpack_tx(&case.signed_tx).unwrap();
        record(&params, &mut reached, &mut by_tag);
    }

    assert_eq!(
        networks.len(),
        2,
        "the corpus must carry both networks, or the cross-network control is vacuous"
    );
    // Every tag a transaction can be mined as. `ChannelOffChainTx` is never
    // mined on its own — it only ever appears wrapped inside a channel
    // transaction's payload, and it is reached that way.
    let expected: BTreeSet<&str> = [
        "SignedTx",
        "SpendTx",
        "OracleRegisterTx",
        "OracleQueryTx",
        "OracleRespondTx",
        "OracleExtendTx",
        "NameClaimTx",
        "NamePreclaimTx",
        "NameUpdateTx",
        "NameRevokeTx",
        "NameTransferTx",
        "ContractCreateTx",
        "ContractCallTx",
        "ChannelCreateTx",
        "ChannelDepositTx",
        "ChannelWithdrawTx",
        "ChannelCloseMutualTx",
        "ChannelCloseSoloTx",
        "ChannelSlashTx",
        "ChannelSettleTx",
        "ChannelSnapshotSoloTx",
        "ChannelForceProgressTx",
        "GaAttachTx",
        "GaMetaTx",
        "PayingForTx",
    ]
    .into_iter()
    .collect();

    let missing: Vec<&&str> = expected
        .iter()
        .filter(|tag| !by_tag.contains_key(**tag))
        .collect();
    assert!(missing.is_empty(), "no mined case for {missing:?}");

    eprintln!(
        "chain corpus reaches {} tag/version pairs: {reached:?}",
        reached.len()
    );
    eprintln!("cases by tag: {by_tag:?}");
}

fn record(
    params: &TxParams,
    reached: &mut BTreeSet<(u32, u32)>,
    by_tag: &mut BTreeMap<String, usize>,
) {
    if let Some(version) = params.version() {
        reached.insert((params.tag().as_u32(), version));
    }
    *by_tag.entry(format!("{:?}", params.tag())).or_default() += 1;
    for value in params.fields().values() {
        if let Value::Tx(inner) = value {
            record(inner, reached, by_tag);
        }
    }
}
