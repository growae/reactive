//! PyO3 binding over `ae-core`'s protocol primitives.
//!
//! Native, not WASM — PyO3 binds the Rust core directly and never reads a WIT
//! file, so this binding is independent of the browser component pipeline.
//!
//! The surface mirrors `ae_core::tx::Value`'s eight shapes and `TxParams`
//! exactly, plus the address/signing operations from `ae_core::keys`. Nothing
//! else from the twelve core modules is bound here: a caller building and
//! signing a transaction never touches `mpt`, `protocol`, `aens`'s internals,
//! or `rlp` directly, so none of them are mirrored.

use ae_core::keys::TxPosition;
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::PyBytes;
use std::collections::BTreeMap;

/// Turn a core error into the Python exception it's reported as.
fn to_py_err(error: ae_core::Error) -> PyErr {
    PyValueError::new_err(error.to_string())
}

/// One field value in a transaction — mirrors `ae_core::tx::Value`.
#[pyclass(name = "Value", module = "ae_core", from_py_object)]
#[derive(Clone)]
pub struct PyValue(ae_core::tx::Value);

#[pymethods]
impl PyValue {
    /// An unsigned integer field, from a Python int small enough for `u64`
    /// (amounts, nonces, TTLs, fees, gas).
    #[staticmethod]
    fn uint(value: u64) -> Self {
        PyValue(ae_core::tx::Value::uint(value))
    }

    /// An unsigned integer field, from a decimal string — for values wider
    /// than `u64`.
    #[staticmethod]
    fn uint_str(value: &str) -> PyResult<Self> {
        ae_core::tx::Value::uint_str(value)
            .map(PyValue)
            .map_err(to_py_err)
    }

    /// A plain string field: an oracle format, a query, an AENS name.
    #[staticmethod]
    fn text(value: String) -> Self {
        PyValue(ae_core::tx::Value::Text(value))
    }

    /// Anything carrying an `xx_...` prefix: addresses, name ids, call data,
    /// state hashes, contract bytearrays.
    #[staticmethod]
    fn encoded(value: String) -> Self {
        PyValue(ae_core::tx::Value::Encoded(value))
    }

    /// Raw bytes with no encoding of their own: signatures, the `authFun`
    /// hash, pre-serialised state-tree entries.
    #[staticmethod]
    fn bytes(value: Vec<u8>) -> Self {
        PyValue(ae_core::tx::Value::Bytes(value))
    }

    /// A repeated field.
    #[staticmethod]
    fn list(values: Vec<PyValue>) -> Self {
        PyValue(ae_core::tx::Value::List(
            values.into_iter().map(|v| v.0).collect(),
        ))
    }

    /// The `pointers` field of a `NameUpdateTx`, as `(key, id)` pairs — `id`
    /// is either an `xx_...` address or, from pointer version 2, a `ba_...`
    /// blob.
    #[staticmethod]
    fn pointers(pointers: Vec<(String, String)>) -> Self {
        PyValue(ae_core::tx::Value::Pointers(
            pointers
                .into_iter()
                .map(|(key, id)| ae_core::tx::Pointer { key, id })
                .collect(),
        ))
    }

    /// The `ctVersion` field: a VM version and an ABI version in one field.
    #[staticmethod]
    fn ct_version(vm_version: u8, abi_version: u8) -> Self {
        PyValue(ae_core::tx::Value::CtVersion {
            vm_version,
            abi_version,
        })
    }

    /// A nested transaction: `SignedTx.encodedTx`, `GaMetaTx.tx`,
    /// `PayingForTx.tx`. Most callers want [`Value.encoded`] with the
    /// nested tx's `tx_...` string instead — that is what the reference SDK
    /// emits.
    #[staticmethod]
    fn tx(params: PyTxParams) -> Self {
        PyValue(ae_core::tx::Value::Tx(Box::new(params.0)))
    }

    /// This value's shape: one of `uint`, `text`, `encoded`, `bytes`,
    /// `list`, `pointers`, `ct_version`, `tx`.
    fn kind(&self) -> &'static str {
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
    }

    /// This value as a decimal string, if it is `uint`.
    fn as_uint_str(&self) -> Option<String> {
        self.0.as_uint().map(ToString::to_string)
    }

    /// This value as a plain string, if it is `text`.
    fn as_text(&self) -> Option<&str> {
        self.0.as_text()
    }

    /// This value as an `xx_...` string, if it is `encoded`.
    fn as_encoded(&self) -> Option<&str> {
        self.0.as_encoded()
    }

    /// This value as raw bytes, if it is `bytes`.
    fn as_bytes<'py>(&self, py: Python<'py>) -> Option<Bound<'py, PyBytes>> {
        self.0.as_bytes().map(|bytes| PyBytes::new(py, bytes))
    }

    /// This value as a nested transaction, if it is `tx`.
    fn as_tx(&self) -> Option<PyTxParams> {
        self.0.as_tx().cloned().map(PyTxParams)
    }

    fn __repr__(&self) -> String {
        format!("Value({:?})", self.0)
    }
}

/// The parameters of one transaction: its tag, an optional pinned serialised
/// version, and its fields by schema name. Mirrors `ae_core::tx::TxParams`.
#[pyclass(name = "TxParams", module = "ae_core", from_py_object)]
#[derive(Clone)]
pub struct PyTxParams(ae_core::tx::TxParams);

#[pymethods]
impl PyTxParams {
    /// A new, empty parameter record for `tag` — the protocol's numeric tag
    /// (`12` for `SpendTx`, `42` for `ContractCreateTx`, and so on; see the
    /// `ae_core.Tag` `IntEnum` in `python/ae_core/__init__.py` for the full,
    /// stable list) — at the tag's default version.
    #[new]
    fn new(tag: u32) -> PyResult<Self> {
        let tag = ae_core::tx::Tag::from_u32(tag).map_err(to_py_err)?;
        Ok(PyTxParams(ae_core::tx::TxParams::new(tag)))
    }

    /// Pin the serialised version instead of taking the tag's default.
    fn set_version(&mut self, version: u32) {
        self.0 = self.0.clone().with_version(version);
    }

    /// Set a field.
    fn set(&mut self, key: &str, value: PyValue) {
        self.0.set(key, value.0);
    }

    /// The transaction's numeric tag.
    #[getter]
    fn tag(&self) -> u32 {
        self.0.tag().as_u32()
    }

    /// The pinned serialised version, if one was pinned.
    #[getter]
    fn version(&self) -> Option<u32> {
        self.0.version()
    }

    /// Read a field.
    fn get(&self, key: &str) -> Option<PyValue> {
        self.0.get(key).cloned().map(PyValue)
    }

    /// Every field, by name.
    fn fields(&self) -> BTreeMap<String, PyValue> {
        self.0
            .fields()
            .iter()
            .map(|(key, value)| (key.clone(), PyValue(value.clone())))
            .collect()
    }

    fn __repr__(&self) -> String {
        format!("TxParams({:?})", self.0)
    }
}

/// Serialise a transaction to its `tx_` string, with explicit fee and gas
/// limit (this binding does not wrap a `FeeModel`; the caller supplies
/// `fee` and, for contract transactions, `gasLimit`).
#[pyfunction]
fn build_tx(params: &PyTxParams) -> PyResult<String> {
    ae_core::tx::build_tx(&params.0).map_err(to_py_err)
}

/// Serialise a transaction to its RLP bytes — what gets hashed and signed.
#[pyfunction]
fn build_tx_rlp<'py>(py: Python<'py>, params: &PyTxParams) -> PyResult<Bound<'py, PyBytes>> {
    let rlp = ae_core::tx::build_tx_rlp(&params.0, &ae_core::tx::BuildOptions::default())
        .map_err(to_py_err)?;
    Ok(PyBytes::new(py, &rlp))
}

/// Parse a `tx_` string back to its parameters.
#[pyfunction]
fn unpack_tx(encoded: &str) -> PyResult<PyTxParams> {
    ae_core::tx::unpack_tx(encoded)
        .map(PyTxParams)
        .map_err(to_py_err)
}

/// Parse a `tx_` string, requiring it to carry `expected_tag`.
#[pyfunction]
fn unpack_tx_as(encoded: &str, expected_tag: u32) -> PyResult<PyTxParams> {
    let tag = ae_core::tx::Tag::from_u32(expected_tag).map_err(to_py_err)?;
    ae_core::tx::unpack_tx_as(encoded, tag)
        .map(PyTxParams)
        .map_err(to_py_err)
}

/// The `th_...` hash of a signed transaction, from its `tx_` string.
#[pyfunction]
fn transaction_hash(encoded_tx: &str) -> PyResult<String> {
    ae_core::tx::transaction_hash(encoded_tx).map_err(to_py_err)
}

/// An account's public key.
#[pyclass(name = "PublicKey", module = "ae_core", from_py_object)]
#[derive(Clone)]
pub struct PyPublicKey(ae_core::keys::PublicKey);

#[pymethods]
impl PyPublicKey {
    /// Parse an `ak_...` address.
    #[staticmethod]
    fn from_address(address: &str) -> PyResult<Self> {
        ae_core::keys::PublicKey::from_address(address)
            .map(PyPublicKey)
            .map_err(to_py_err)
    }

    /// The `ak_...` address.
    fn address(&self) -> PyResult<String> {
        self.0.to_address().map_err(to_py_err)
    }

    /// Verify a detached signature over `message`.
    fn verify(&self, message: &[u8], signature: &PySignature) -> bool {
        self.0.verify(message, &signature.0)
    }

    /// Verify a signature over a transaction, given the network id it was
    /// signed for. Set `inner=True` for a signature taken over a
    /// `GaMetaTx`/`PayingForTx`-wrapped transaction.
    ///
    /// Accepts either payload a node accepts: the transaction's hash under the
    /// network id, which is what this library signs, and the transaction itself
    /// under the network id, which the node's own state-channel FSM signs. Both
    /// still carry the network id and the `inner` suffix, so a signature does
    /// not carry across a network or across the inner boundary. Signing is
    /// unaffected — `SecretKey.sign_transaction` emits the hashed payload only.
    #[pyo3(signature = (transaction, network_id, signature, inner=false))]
    fn verify_transaction(
        &self,
        transaction: &[u8],
        network_id: &str,
        signature: &PySignature,
        inner: bool,
    ) -> bool {
        self.0
            .verify_transaction(transaction, network_id, position(inner), &signature.0)
    }

    fn __repr__(&self) -> String {
        format!("PublicKey({:?})", self.0)
    }
}

/// A detached Ed25519 signature.
#[pyclass(name = "Signature", module = "ae_core", from_py_object)]
#[derive(Clone)]
pub struct PySignature(ae_core::keys::Signature);

#[pymethods]
impl PySignature {
    /// Parse an `sg_...` spelling.
    #[staticmethod]
    fn from_encoded(input: &str) -> PyResult<Self> {
        ae_core::keys::Signature::from_encoded(input)
            .map(PySignature)
            .map_err(to_py_err)
    }

    /// The `sg_...` spelling.
    fn to_encoded(&self) -> PyResult<String> {
        self.0.to_encoded().map_err(to_py_err)
    }

    /// The raw 64 signature bytes.
    fn to_bytes<'py>(&self, py: Python<'py>) -> Bound<'py, PyBytes> {
        PyBytes::new(py, self.0.as_bytes())
    }

    fn __repr__(&self) -> String {
        format!("{:?}", self.0)
    }
}

/// An account's secret key.
///
/// The wire form is the 32-byte Ed25519 seed, spelled `sk_...`. Nothing here
/// logs, formats or serialises it; the only way it leaves this type is
/// [`PySecretKey::to_encoded`], which a caller has to ask for by name.
#[pyclass(name = "SecretKey", module = "ae_core")]
pub struct PySecretKey(ae_core::keys::SecretKey);

#[pymethods]
impl PySecretKey {
    /// Build from a 32-byte seed.
    #[staticmethod]
    fn from_seed(seed: [u8; 32]) -> Self {
        PySecretKey(ae_core::keys::SecretKey::from_seed(seed))
    }

    /// Generate a key from the operating system's randomness. For tests and
    /// for callers that hold their own keys — this crate never persists one.
    #[staticmethod]
    fn generate() -> Self {
        PySecretKey(ae_core::keys::SecretKey::generate())
    }

    /// Parse an `sk_...` spelling.
    #[staticmethod]
    fn from_encoded(input: &str) -> PyResult<Self> {
        ae_core::keys::SecretKey::from_encoded(input)
            .map(PySecretKey)
            .map_err(to_py_err)
    }

    /// The `sk_...` spelling — the one way key material leaves this type.
    fn to_encoded(&self) -> PyResult<String> {
        self.0.to_encoded().map_err(to_py_err)
    }

    /// The matching public key.
    fn public_key(&self) -> PyPublicKey {
        PyPublicKey(self.0.public_key())
    }

    /// The account's `ak_...` address.
    fn address(&self) -> PyResult<String> {
        self.0.to_address().map_err(to_py_err)
    }

    /// Sign a serialised transaction for `network_id`. Set `inner=True` when
    /// this transaction will be wrapped by a `GaMetaTx`/`PayingForTx` — the
    /// signature is not valid for the same transaction signed outer.
    #[pyo3(signature = (transaction, network_id, inner=false))]
    fn sign_transaction(&self, transaction: &[u8], network_id: &str, inner: bool) -> PySignature {
        PySignature(
            self.0
                .sign_transaction(transaction, network_id, position(inner)),
        )
    }

    /// Sign a human-readable message under the `aeternity Signed Message:`
    /// prefix.
    fn sign_message(&self, message: &str) -> PySignature {
        PySignature(self.0.sign_message(message))
    }

    fn __repr__(&self) -> String {
        format!("{:?}", self.0)
    }
}

/// Map the Python `inner` flag onto the core's `TxPosition`.
fn position(inner: bool) -> TxPosition {
    if inner {
        TxPosition::Inner
    } else {
        TxPosition::Outer
    }
}

/// PyO3 binding over `ae-core`'s protocol primitives: transaction
/// serialisation, addresses and Ed25519 signing. Bytes in, bytes out — no
/// node HTTP client, no async, no retries.
#[pymodule]
fn _ae_core(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add("NETWORK_ID_MAINNET", ae_core::keys::NETWORK_ID_MAINNET)?;
    m.add("NETWORK_ID_TESTNET", ae_core::keys::NETWORK_ID_TESTNET)?;
    m.add_class::<PyValue>()?;
    m.add_class::<PyTxParams>()?;
    m.add_class::<PyPublicKey>()?;
    m.add_class::<PySignature>()?;
    m.add_class::<PySecretKey>()?;
    m.add_function(wrap_pyfunction!(build_tx, m)?)?;
    m.add_function(wrap_pyfunction!(build_tx_rlp, m)?)?;
    m.add_function(wrap_pyfunction!(unpack_tx, m)?)?;
    m.add_function(wrap_pyfunction!(unpack_tx_as, m)?)?;
    m.add_function(wrap_pyfunction!(transaction_hash, m)?)?;
    Ok(())
}
