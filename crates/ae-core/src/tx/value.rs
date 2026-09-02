//! The value type transaction fields carry, and the parameter record.
//!
//! This enum is the crate's widest public type and every binding has to mirror
//! it, so it is deliberately small: eight shapes, no generics, no lifetimes.

use crate::error::{Error, Result};
use crate::tx::Tag;
use num_bigint::BigUint;
use std::collections::BTreeMap;

/// One AENS pointer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Pointer {
    /// The pointer key, e.g. `account_pubkey`.
    pub key: String,
    /// Either an `xx_...` address or, from pointer version 2, a `ba_...` blob.
    pub id: String,
}

/// The value of a transaction field.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Value {
    /// Any unsigned integer field: amounts, nonces, TTLs, fees, gas.
    Uint(BigUint),
    /// A plain string field: an oracle format, a query, an AENS name.
    Text(String),
    /// Anything carrying an `xx_...` prefix: addresses, name ids, call data,
    /// state hashes, contract bytearrays.
    Encoded(String),
    /// Raw bytes with no encoding of their own: signatures, the `authFun` hash,
    /// and pre-serialised state-tree entries.
    Bytes(Vec<u8>),
    /// A repeated field.
    List(Vec<Value>),
    /// The `pointers` field of a `NameUpdateTx`.
    Pointers(Vec<Pointer>),
    /// The `ctVersion` field: a VM version and an ABI version in one field.
    CtVersion {
        /// VM version byte.
        vm_version: u8,
        /// ABI version byte.
        abi_version: u8,
    },
    /// A nested transaction: `SignedTx.encodedTx`, `GaMetaTx.tx`, `PayingForTx.tx`.
    Tx(Box<TxParams>),
}

impl Value {
    /// Construct an integer value from a `u64`.
    pub fn uint(value: u64) -> Value {
        Value::Uint(BigUint::from(value))
    }

    /// Construct an integer value from a decimal string.
    pub fn uint_str(value: &str) -> Result<Value> {
        BigUint::parse_bytes(value.as_bytes(), 10)
            .map(Value::Uint)
            .ok_or_else(|| Error::FieldValue {
                field: "uint",
                reason: format!("`{value}` is not a decimal unsigned integer"),
            })
    }

    /// Borrow this value as an unsigned integer.
    pub fn as_uint(&self) -> Option<&BigUint> {
        match self {
            Value::Uint(v) => Some(v),
            _ => None,
        }
    }

    /// Read this value as a `u64`, if it is an integer that fits.
    pub fn as_u64(&self) -> Option<u64> {
        match self {
            Value::Uint(v) => u64::try_from(v).ok(),
            _ => None,
        }
    }

    /// Borrow this value as an `xx_...` string.
    pub fn as_encoded(&self) -> Option<&str> {
        match self {
            Value::Encoded(s) => Some(s),
            _ => None,
        }
    }

    /// Borrow this value as a plain string.
    pub fn as_text(&self) -> Option<&str> {
        match self {
            Value::Text(s) => Some(s),
            _ => None,
        }
    }

    /// Borrow this value as raw bytes.
    pub fn as_bytes(&self) -> Option<&[u8]> {
        match self {
            Value::Bytes(b) => Some(b),
            _ => None,
        }
    }

    /// Borrow this value as a nested transaction.
    pub fn as_tx(&self) -> Option<&TxParams> {
        match self {
            Value::Tx(tx) => Some(tx),
            _ => None,
        }
    }
}

impl From<u64> for Value {
    fn from(value: u64) -> Self {
        Value::uint(value)
    }
}

impl From<BigUint> for Value {
    fn from(value: BigUint) -> Self {
        Value::Uint(value)
    }
}

impl From<&str> for Value {
    /// Anything shaped `xx_...` becomes [`Value::Encoded`]; everything else
    /// becomes [`Value::Text`]. Construct the variant explicitly where the
    /// distinction matters, such as an AENS name that is also a valid prefix.
    fn from(value: &str) -> Self {
        let looks_encoded = value.len() > 3
            && value.as_bytes()[2] == b'_'
            && crate::encoding::Encoding::from_prefix(&value[..2]).is_some();
        if looks_encoded {
            Value::Encoded(value.to_string())
        } else {
            Value::Text(value.to_string())
        }
    }
}

impl From<TxParams> for Value {
    fn from(value: TxParams) -> Self {
        Value::Tx(Box::new(value))
    }
}

/// The parameters of one transaction: its tag, an optional serialised version,
/// and its fields by schema name.
///
/// Absent fields are absent from the map. Whether an absent field is an error or
/// takes a default is the schema's business, not the caller's.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TxParams {
    tag: Tag,
    version: Option<u32>,
    fields: BTreeMap<String, Value>,
}

impl TxParams {
    /// A new, empty parameter record for `tag`, at the tag's default version.
    pub fn new(tag: Tag) -> Self {
        TxParams {
            tag,
            version: None,
            fields: BTreeMap::new(),
        }
    }

    /// Pin the serialised version instead of taking the tag's default.
    pub fn with_version(mut self, version: u32) -> Self {
        self.version = Some(version);
        self
    }

    /// Set a field, chaining.
    #[must_use]
    pub fn with(mut self, key: &str, value: impl Into<Value>) -> Self {
        self.set(key, value);
        self
    }

    /// Set a field.
    pub fn set(&mut self, key: &str, value: impl Into<Value>) {
        self.fields.insert(key.to_string(), value.into());
    }

    /// The transaction tag.
    pub fn tag(&self) -> Tag {
        self.tag
    }

    /// The pinned serialised version, if the caller pinned one.
    pub fn version(&self) -> Option<u32> {
        self.version
    }

    /// Read a field.
    pub fn get(&self, key: &str) -> Option<&Value> {
        self.fields.get(key)
    }

    /// Every field, by name.
    pub fn fields(&self) -> &BTreeMap<String, Value> {
        &self.fields
    }
}
