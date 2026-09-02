//! `flutter_rust_bridge` binding over `ae-core`'s protocol primitives.
//!
//! Mirrors `bindings/python/src/lib.rs` shape-for-shape: `Value`'s eight
//! shapes, `TxParams`, the address/signing operations from `ae_core::keys`,
//! and the fee model's joined entry point. `TxGasInputs`, `RebuildTx` and
//! `calculate_min_fee` stay unmirrored, same as Python.

use ae_core::keys::TxPosition;
use ae_core::protocol::ConsensusProtocolVersion;
use flutter_rust_bridge::frb;

/// Turn a core error into the message a Dart caller sees on the thrown
/// exception.
fn to_err(error: ae_core::Error) -> String {
    error.to_string()
}

/// The mainnet network id, for `signTransaction`/`verifyTransaction`.
#[frb(sync)]
pub fn network_id_mainnet() -> String {
    ae_core::keys::NETWORK_ID_MAINNET.to_string()
}

/// The public testnet's network id.
#[frb(sync)]
pub fn network_id_testnet() -> String {
    ae_core::keys::NETWORK_ID_TESTNET.to_string()
}

/// Every transaction tag the node serialises, with its on-chain numeric
/// value — mirrors `ae_core::tx::Tag` and, in shape, `ae_core.Tag` in the
/// Python binding. Kept in step with the Rust crate by hand, same as there:
/// the numbers are protocol constants and are not consecutive.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Tag {
    /// A transaction plus its signatures.
    SignedTx,
    /// Transfer of AE between two accounts.
    SpendTx,
    /// Register an oracle.
    OracleRegisterTx,
    /// Ask a registered oracle a question.
    OracleQueryTx,
    /// Answer an oracle query.
    OracleRespondTx,
    /// Extend an oracle's TTL.
    OracleExtendTx,
    /// Claim a preclaimed AENS name.
    NameClaimTx,
    /// Commit to claiming an AENS name.
    NamePreclaimTx,
    /// Update an AENS name's pointers and TTLs.
    NameUpdateTx,
    /// Revoke an AENS name.
    NameRevokeTx,
    /// Transfer an AENS name to another account.
    NameTransferTx,
    /// Deploy a contract.
    ContractCreateTx,
    /// Call a deployed contract.
    ContractCallTx,
    /// Open a state channel.
    ChannelCreateTx,
    /// Deposit into a state channel.
    ChannelDepositTx,
    /// Withdraw from a state channel.
    ChannelWithdrawTx,
    /// Close a state channel with both parties' agreement.
    ChannelCloseMutualTx,
    /// Close a state channel unilaterally.
    ChannelCloseSoloTx,
    /// Punish a counterparty who closed on an outdated state.
    ChannelSlashTx,
    /// Settle a channel after the lock period.
    ChannelSettleTx,
    /// An off-chain channel state update.
    ChannelOffChainTx,
    /// Snapshot a channel's off-chain state on-chain.
    ChannelSnapshotSoloTx,
    /// Force a contract call on-chain inside a channel.
    ChannelForceProgressTx,
    /// Attach generalized-account authorisation to an account.
    GaAttachTx,
    /// A generalized-account meta transaction wrapping an inner transaction.
    GaMetaTx,
    /// Pay another account's transaction fee.
    PayingForTx,
}

impl Tag {
    fn to_core(self) -> ae_core::tx::Tag {
        match self {
            Tag::SignedTx => ae_core::tx::Tag::SignedTx,
            Tag::SpendTx => ae_core::tx::Tag::SpendTx,
            Tag::OracleRegisterTx => ae_core::tx::Tag::OracleRegisterTx,
            Tag::OracleQueryTx => ae_core::tx::Tag::OracleQueryTx,
            Tag::OracleRespondTx => ae_core::tx::Tag::OracleRespondTx,
            Tag::OracleExtendTx => ae_core::tx::Tag::OracleExtendTx,
            Tag::NameClaimTx => ae_core::tx::Tag::NameClaimTx,
            Tag::NamePreclaimTx => ae_core::tx::Tag::NamePreclaimTx,
            Tag::NameUpdateTx => ae_core::tx::Tag::NameUpdateTx,
            Tag::NameRevokeTx => ae_core::tx::Tag::NameRevokeTx,
            Tag::NameTransferTx => ae_core::tx::Tag::NameTransferTx,
            Tag::ContractCreateTx => ae_core::tx::Tag::ContractCreateTx,
            Tag::ContractCallTx => ae_core::tx::Tag::ContractCallTx,
            Tag::ChannelCreateTx => ae_core::tx::Tag::ChannelCreateTx,
            Tag::ChannelDepositTx => ae_core::tx::Tag::ChannelDepositTx,
            Tag::ChannelWithdrawTx => ae_core::tx::Tag::ChannelWithdrawTx,
            Tag::ChannelCloseMutualTx => ae_core::tx::Tag::ChannelCloseMutualTx,
            Tag::ChannelCloseSoloTx => ae_core::tx::Tag::ChannelCloseSoloTx,
            Tag::ChannelSlashTx => ae_core::tx::Tag::ChannelSlashTx,
            Tag::ChannelSettleTx => ae_core::tx::Tag::ChannelSettleTx,
            Tag::ChannelOffChainTx => ae_core::tx::Tag::ChannelOffChainTx,
            Tag::ChannelSnapshotSoloTx => ae_core::tx::Tag::ChannelSnapshotSoloTx,
            Tag::ChannelForceProgressTx => ae_core::tx::Tag::ChannelForceProgressTx,
            Tag::GaAttachTx => ae_core::tx::Tag::GaAttachTx,
            Tag::GaMetaTx => ae_core::tx::Tag::GaMetaTx,
            Tag::PayingForTx => ae_core::tx::Tag::PayingForTx,
        }
    }

    fn from_core(tag: ae_core::tx::Tag) -> Self {
        match tag {
            ae_core::tx::Tag::SignedTx => Tag::SignedTx,
            ae_core::tx::Tag::SpendTx => Tag::SpendTx,
            ae_core::tx::Tag::OracleRegisterTx => Tag::OracleRegisterTx,
            ae_core::tx::Tag::OracleQueryTx => Tag::OracleQueryTx,
            ae_core::tx::Tag::OracleRespondTx => Tag::OracleRespondTx,
            ae_core::tx::Tag::OracleExtendTx => Tag::OracleExtendTx,
            ae_core::tx::Tag::NameClaimTx => Tag::NameClaimTx,
            ae_core::tx::Tag::NamePreclaimTx => Tag::NamePreclaimTx,
            ae_core::tx::Tag::NameUpdateTx => Tag::NameUpdateTx,
            ae_core::tx::Tag::NameRevokeTx => Tag::NameRevokeTx,
            ae_core::tx::Tag::NameTransferTx => Tag::NameTransferTx,
            ae_core::tx::Tag::ContractCreateTx => Tag::ContractCreateTx,
            ae_core::tx::Tag::ContractCallTx => Tag::ContractCallTx,
            ae_core::tx::Tag::ChannelCreateTx => Tag::ChannelCreateTx,
            ae_core::tx::Tag::ChannelDepositTx => Tag::ChannelDepositTx,
            ae_core::tx::Tag::ChannelWithdrawTx => Tag::ChannelWithdrawTx,
            ae_core::tx::Tag::ChannelCloseMutualTx => Tag::ChannelCloseMutualTx,
            ae_core::tx::Tag::ChannelCloseSoloTx => Tag::ChannelCloseSoloTx,
            ae_core::tx::Tag::ChannelSlashTx => Tag::ChannelSlashTx,
            ae_core::tx::Tag::ChannelSettleTx => Tag::ChannelSettleTx,
            ae_core::tx::Tag::ChannelOffChainTx => Tag::ChannelOffChainTx,
            ae_core::tx::Tag::ChannelSnapshotSoloTx => Tag::ChannelSnapshotSoloTx,
            ae_core::tx::Tag::ChannelForceProgressTx => Tag::ChannelForceProgressTx,
            ae_core::tx::Tag::GaAttachTx => Tag::GaAttachTx,
            ae_core::tx::Tag::GaMetaTx => Tag::GaMetaTx,
            ae_core::tx::Tag::PayingForTx => Tag::PayingForTx,
        }
    }

    /// The tag's on-chain numeric value, for a caller that wants to pin it
    /// down independently of this enum's Dart spelling.
    #[frb(sync)]
    pub fn as_u32(self) -> u32 {
        self.to_core().as_u32()
    }

    /// Parse a numeric tag. Errors if the number is not one the node
    /// serialises.
    #[frb(sync)]
    pub fn from_u32(value: u32) -> Result<Self, String> {
        ae_core::tx::Tag::from_u32(value)
            .map(Tag::from_core)
            .map_err(to_err)
    }
}

/// One field value in a transaction — mirrors `ae_core::tx::Value`.
#[frb(opaque)]
pub struct Value(pub(crate) ae_core::tx::Value);

impl Value {
    /// An unsigned integer field, from a value small enough for `u64`
    /// (amounts, nonces, TTLs, fees, gas).
    #[frb(sync)]
    pub fn uint(value: u64) -> Self {
        Value(ae_core::tx::Value::uint(value))
    }

    /// An unsigned integer field, from a decimal string — for values wider
    /// than `u64`.
    #[frb(sync)]
    pub fn uint_str(value: String) -> Result<Self, String> {
        ae_core::tx::Value::uint_str(&value)
            .map(Value)
            .map_err(to_err)
    }

    /// A plain string field: an oracle format, a query, an AENS name.
    #[frb(sync)]
    pub fn text(value: String) -> Self {
        Value(ae_core::tx::Value::Text(value))
    }

    /// Anything carrying an `xx_...` prefix: addresses, name ids, call data,
    /// state hashes, contract bytearrays.
    #[frb(sync)]
    pub fn encoded(value: String) -> Self {
        Value(ae_core::tx::Value::Encoded(value))
    }

    /// Raw bytes with no encoding of their own: signatures, the `authFun`
    /// hash, pre-serialised state-tree entries.
    #[frb(sync)]
    pub fn bytes(value: Vec<u8>) -> Self {
        Value(ae_core::tx::Value::Bytes(value))
    }

    /// A repeated field.
    #[frb(sync)]
    pub fn list(values: Vec<Value>) -> Self {
        Value(ae_core::tx::Value::List(
            values.into_iter().map(|v| v.0).collect(),
        ))
    }

    /// The `pointers` field of a `NameUpdateTx`, as `(key, id)` pairs — `id`
    /// is either an `xx_...` address or, from pointer version 2, a `ba_...`
    /// blob.
    #[frb(sync)]
    pub fn pointers(pointers: Vec<(String, String)>) -> Self {
        Value(ae_core::tx::Value::Pointers(
            pointers
                .into_iter()
                .map(|(key, id)| ae_core::tx::Pointer { key, id })
                .collect(),
        ))
    }

    /// The `ctVersion` field: a VM version and an ABI version in one field.
    #[frb(sync)]
    pub fn ct_version(vm_version: u8, abi_version: u8) -> Self {
        Value(ae_core::tx::Value::CtVersion {
            vm_version,
            abi_version,
        })
    }

    /// A nested transaction: `SignedTx.encodedTx`, `GaMetaTx.tx`,
    /// `PayingForTx.tx`. Most callers want [`Value::encoded`] with the
    /// nested tx's `tx_...` string instead — that is what the reference SDK
    /// emits.
    ///
    /// Takes `params` by reference and clones it, rather than consuming it —
    /// the PyO3 binding's equivalent clones out of the Python wrapper
    /// implicitly (`from_py_object`), and a `TxParams` a caller built once
    /// to wrap into several sibling `GaMetaTx`/`PayingForTx` arms should
    /// stay usable after the first wrap, not be disposed by it.
    #[frb(sync)]
    pub fn tx(params: &TxParams) -> Self {
        Value(ae_core::tx::Value::Tx(Box::new(params.0.clone())))
    }

    /// This value's shape: one of `uint`, `text`, `encoded`, `bytes`,
    /// `list`, `pointers`, `ct_version`, `tx`.
    #[frb(sync)]
    pub fn kind(&self) -> String {
        match &self.0 {
            ae_core::tx::Value::Uint(_) => "uint",
            ae_core::tx::Value::Text(_) => "text",
            ae_core::tx::Value::Encoded(_) => "encoded",
            ae_core::tx::Value::Bytes(_) => "bytes",
            ae_core::tx::Value::List(_) => "list",
            ae_core::tx::Value::Pointers(_) => "pointers",
            ae_core::tx::Value::CtVersion { .. } => "ct_version",
            ae_core::tx::Value::Tx(_) => "tx",
        }
        .to_string()
    }

    /// This value as a decimal string, if it is `uint`.
    #[frb(sync)]
    pub fn as_uint_str(&self) -> Option<String> {
        self.0.as_uint().map(|v| v.to_string())
    }

    /// This value as a plain string, if it is `text`.
    #[frb(sync)]
    pub fn as_text(&self) -> Option<String> {
        self.0.as_text().map(str::to_string)
    }

    /// This value as an `xx_...` string, if it is `encoded`.
    #[frb(sync)]
    pub fn as_encoded(&self) -> Option<String> {
        self.0.as_encoded().map(str::to_string)
    }

    /// This value as raw bytes, if it is `bytes`.
    #[frb(sync)]
    pub fn as_bytes(&self) -> Option<Vec<u8>> {
        self.0.as_bytes().map(<[u8]>::to_vec)
    }

    /// This value as a nested transaction, if it is `tx`.
    #[frb(sync)]
    pub fn as_tx(&self) -> Option<TxParams> {
        self.0.as_tx().cloned().map(TxParams)
    }
}

/// The parameters of one transaction: its tag, an optional pinned serialised
/// version, and its fields by schema name. Mirrors `ae_core::tx::TxParams`.
#[frb(opaque)]
#[derive(Clone)]
pub struct TxParams(pub(crate) ae_core::tx::TxParams);

impl TxParams {
    /// A new, empty parameter record for `tag` — the protocol's numeric tag
    /// (`12` for `SpendTx`, `42` for `ContractCreateTx`, and so on; see the
    /// `Tag` enum for the full, stable list) — at the tag's default version.
    #[frb(sync)]
    pub fn new(tag: Tag) -> Self {
        TxParams(ae_core::tx::TxParams::new(tag.to_core()))
    }

    /// Pin the serialised version instead of taking the tag's default.
    #[frb(sync)]
    pub fn set_version(&mut self, version: u32) {
        self.0 = self.0.clone().with_version(version);
    }

    /// Set a field.
    #[frb(sync)]
    pub fn set(&mut self, key: String, value: Value) {
        self.0.set(&key, value.0);
    }

    /// The transaction's tag.
    #[frb(sync)]
    pub fn tag(&self) -> Tag {
        Tag::from_core(self.0.tag())
    }

    /// The pinned serialised version, if one was pinned.
    #[frb(sync)]
    pub fn version(&self) -> Option<u32> {
        self.0.version()
    }

    /// Read a field.
    #[frb(sync)]
    pub fn get(&self, key: String) -> Option<Value> {
        self.0.get(&key).cloned().map(Value)
    }

    /// Every field, by name, in schema order. `BTreeMap` does not round-trip
    /// through the FFI boundary for a map keyed on an opaque value type, so
    /// this is `(key, value)` pairs rather than a Dart `Map` — a caller who
    /// wants a map builds one from the pairs.
    #[frb(sync)]
    pub fn fields(&self) -> Vec<(String, Value)> {
        self.0
            .fields()
            .iter()
            .map(|(key, value)| (key.clone(), Value(value.clone())))
            .collect()
    }
}

/// Serialise a transaction to its `tx_` string, with explicit fee and gas
/// limit (this binding does not wrap a `FeeModel`; the caller supplies
/// `fee` and, for contract transactions, `gasLimit`).
#[frb(sync)]
pub fn build_tx(params: &TxParams) -> Result<String, String> {
    ae_core::tx::build_tx(&params.0).map_err(to_err)
}

/// Serialise a transaction to its RLP bytes — what gets hashed and signed.
#[frb(sync)]
pub fn build_tx_rlp(params: &TxParams) -> Result<Vec<u8>, String> {
    ae_core::tx::build_tx_rlp(&params.0, &ae_core::tx::BuildOptions::default()).map_err(to_err)
}

/// Parse a `tx_` string back to its parameters.
#[frb(sync)]
pub fn unpack_tx(encoded: String) -> Result<TxParams, String> {
    ae_core::tx::unpack_tx(&encoded)
        .map(TxParams)
        .map_err(to_err)
}

/// Parse a `tx_` string, requiring it to carry `expected_tag`.
#[frb(sync)]
pub fn unpack_tx_as(encoded: String, expected_tag: Tag) -> Result<TxParams, String> {
    ae_core::tx::unpack_tx_as(&encoded, expected_tag.to_core())
        .map(TxParams)
        .map_err(to_err)
}

/// The `th_...` hash of a signed transaction, from its `tx_` string.
#[frb(sync)]
pub fn transaction_hash(encoded_tx: String) -> Result<String, String> {
    ae_core::tx::transaction_hash(&encoded_tx).map_err(to_err)
}

/// The smallest fee, in aettos, `params` may carry.
///
/// Forwards `ae_core::fee::minimum_transaction_fee` — the joined entry point —
/// rather than hand-writing a `RebuildTx` bridge in this binding, same as
/// `bindings/python`. That matters beyond style: the ABI byte this prices a
/// `ContractCallTx` at comes off the wire `build_tx` will actually
/// serialise, not off whether the caller's `TxParams` happens to carry an
/// explicit `abiVersion`, and a bridge written per binding is exactly where
/// that distinction has gone missing before.
///
/// Returned as a decimal string: the minimum fee can exceed what fits in a
/// 64-bit int, and `flutter_rust_bridge` maps `u128` through a string rather
/// than Dart's `BigInt` by default across this boundary.
///
/// # Errors
///
/// - `gasLimit` absent on a contract transaction — no default is invented.
/// - An oracle ttl given as an absolute block height — convert it to a delta
///   first; this function does not look up the current height.
#[frb(sync)]
pub fn minimum_transaction_fee(params: &TxParams) -> Result<String, String> {
    ae_core::fee::minimum_transaction_fee(ConsensusProtocolVersion::default(), &params.0)
        .map(|fee| fee.to_string())
        .map_err(to_err)
}

/// An account's public key.
#[frb(opaque)]
#[derive(Clone)]
pub struct PublicKey(pub(crate) ae_core::keys::PublicKey);

impl PublicKey {
    /// Parse an `ak_...` address.
    #[frb(sync)]
    pub fn from_address(address: String) -> Result<Self, String> {
        ae_core::keys::PublicKey::from_address(&address)
            .map(PublicKey)
            .map_err(to_err)
    }

    /// The `ak_...` address.
    #[frb(sync)]
    pub fn address(&self) -> Result<String, String> {
        self.0.to_address().map_err(to_err)
    }

    /// Verify a detached signature over `message`.
    #[frb(sync)]
    pub fn verify(&self, message: Vec<u8>, signature: &Signature) -> bool {
        self.0.verify(&message, &signature.0)
    }

    /// Verify a signature over a transaction, given the network id it was
    /// signed for. Set `inner: true` for a signature taken over a
    /// `GaMetaTx`/`PayingForTx`-wrapped transaction.
    ///
    /// Accepts either payload a node accepts: the transaction's hash under
    /// the network id, which is what this library signs, and the
    /// transaction itself under the network id, which the node's own
    /// state-channel FSM signs. Both still carry the network id and the
    /// `inner` suffix, so a signature does not carry across a network or
    /// across the inner boundary. Signing is unaffected —
    /// `SecretKey.signTransaction` emits the hashed payload only.
    #[frb(sync)]
    pub fn verify_transaction(
        &self,
        transaction: Vec<u8>,
        network_id: String,
        signature: &Signature,
        inner: bool,
    ) -> bool {
        self.0
            .verify_transaction(&transaction, &network_id, position(inner), &signature.0)
    }
}

/// A detached Ed25519 signature.
#[frb(opaque)]
#[derive(Clone)]
pub struct Signature(pub(crate) ae_core::keys::Signature);

impl Signature {
    /// Parse an `sg_...` spelling.
    #[frb(sync)]
    pub fn from_encoded(input: String) -> Result<Self, String> {
        ae_core::keys::Signature::from_encoded(&input)
            .map(Signature)
            .map_err(to_err)
    }

    /// The `sg_...` spelling.
    #[frb(sync)]
    pub fn to_encoded(&self) -> Result<String, String> {
        self.0.to_encoded().map_err(to_err)
    }

    /// The raw 64 signature bytes.
    #[frb(sync)]
    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.as_bytes().to_vec()
    }
}

/// An account's secret key.
///
/// The wire form is the 32-byte Ed25519 seed, spelled `sk_...`. Nothing here
/// logs, formats or serialises it; the only way it leaves this type is
/// [`SecretKey::to_encoded`], which a caller has to ask for by name.
#[frb(opaque)]
pub struct SecretKey(ae_core::keys::SecretKey);

impl SecretKey {
    /// Build from a 32-byte seed.
    #[frb(sync)]
    pub fn from_seed(seed: [u8; 32]) -> Self {
        SecretKey(ae_core::keys::SecretKey::from_seed(seed))
    }

    /// Generate a key from the operating system's randomness. For tests and
    /// for callers that hold their own keys — this crate never persists one.
    #[frb(sync)]
    pub fn generate() -> Self {
        SecretKey(ae_core::keys::SecretKey::generate())
    }

    /// Parse an `sk_...` spelling.
    #[frb(sync)]
    pub fn from_encoded(input: String) -> Result<Self, String> {
        ae_core::keys::SecretKey::from_encoded(&input)
            .map(SecretKey)
            .map_err(to_err)
    }

    /// The `sk_...` spelling — the one way key material leaves this type.
    #[frb(sync)]
    pub fn to_encoded(&self) -> Result<String, String> {
        self.0.to_encoded().map_err(to_err)
    }

    /// The matching public key.
    #[frb(sync)]
    pub fn public_key(&self) -> PublicKey {
        PublicKey(self.0.public_key())
    }

    /// The account's `ak_...` address.
    #[frb(sync)]
    pub fn address(&self) -> Result<String, String> {
        self.0.to_address().map_err(to_err)
    }

    /// Sign a serialised transaction for `network_id`. Set `inner: true`
    /// when this transaction will be wrapped by a
    /// `GaMetaTx`/`PayingForTx` — the signature is not valid for the same
    /// transaction signed outer.
    #[frb(sync)]
    pub fn sign_transaction(
        &self,
        transaction: Vec<u8>,
        network_id: String,
        inner: bool,
    ) -> Signature {
        Signature(
            self.0
                .sign_transaction(&transaction, &network_id, position(inner)),
        )
    }

    /// Sign a human-readable message under the `aeternity Signed Message:`
    /// prefix.
    #[frb(sync)]
    pub fn sign_message(&self, message: String) -> Signature {
        Signature(self.0.sign_message(&message))
    }
}

/// Map the Dart `inner` flag onto the core's `TxPosition`.
fn position(inner: bool) -> TxPosition {
    if inner {
        TxPosition::Inner
    } else {
        TxPosition::Outer
    }
}
