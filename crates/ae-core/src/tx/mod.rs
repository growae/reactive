//! Transaction serialisation: `TxParams` → `tx_...` and back.
//!
//! The wire format is `rlp([tag, version] ++ fields)`, base64check-encoded under
//! the `tx_` prefix. Field order comes from [`schema`] and is the format.

mod codec;
pub mod schema;
mod tag;
mod value;

pub use schema::{EntryTag, FieldKind, SchemaEntry, TX_SCHEMA};
pub use tag::{Tag, ALL_TAGS};
pub use value::{Pointer, TxParams, Value};

/// The two field resolutions the fee model has to agree with byte for byte.
///
/// Not public: a consumer prices a transaction through
/// [`crate::fee::minimum_transaction_fee`], which is the point of that function.
pub(crate) use codec::{abi_version_byte, nested_tx_bytes};

use crate::encoding::{self, Encoding};
use crate::error::{Error, Result};
use crate::protocol::ConsensusProtocolVersion;
use crate::rlp;
use num_bigint::BigUint;

/// The fee and gas model.
///
/// Implemented by the fee/gas workstream, not here. Both methods are fixed
/// points: the minimum fee depends on the size of the transaction, which depends
/// on the fee, so the model rebuilds the transaction with a candidate value until
/// the answer stops moving. `rebuild` returns the RLP bytes of the transaction
/// built with the candidate.
pub trait FeeModel {
    /// The minimum fee, in aettos, that this transaction must carry.
    fn min_fee(
        &self,
        params: &TxParams,
        rebuild: &dyn Fn(&BigUint) -> Result<Vec<u8>>,
    ) -> Result<BigUint>;

    /// The largest gas limit this transaction may declare.
    fn max_gas_limit(
        &self,
        params: &TxParams,
        rebuild: &dyn Fn(u64) -> Result<Vec<u8>>,
    ) -> Result<u64>;
}

/// Everything `build_tx` needs beyond the parameters themselves.
#[derive(Default, Clone, Copy)]
pub struct BuildOptions<'a> {
    /// Which protocol's defaults to apply to version-sensitive fields.
    pub protocol: ConsensusProtocolVersion,
    /// The fee/gas model. Without one, `fee` and `gasLimit` must be explicit.
    pub fee_model: Option<&'a dyn FeeModel>,
}

/// Values that override what `params` holds, used to drive the fee fixed point.
#[derive(Default, Clone)]
pub(crate) struct Overrides {
    pub fee: Option<BigUint>,
    pub gas_limit: Option<u64>,
}

/// Serialise a transaction to its `tx_` string, with explicit fee and gas limit.
pub fn build_tx(params: &TxParams) -> Result<String> {
    build_tx_with(params, &BuildOptions::default())
}

/// Serialise a transaction to its `tx_` string.
pub fn build_tx_with(params: &TxParams, options: &BuildOptions<'_>) -> Result<String> {
    encoding::encode(&build_tx_rlp(params, options)?, Encoding::Transaction)
}

/// Serialise a transaction to its RLP bytes — what gets hashed and signed.
pub fn build_tx_rlp(params: &TxParams, options: &BuildOptions<'_>) -> Result<Vec<u8>> {
    build_rlp(params, options, &Overrides::default())
}

pub(crate) fn build_rlp(
    params: &TxParams,
    options: &BuildOptions<'_>,
    overrides: &Overrides,
) -> Result<Vec<u8>> {
    let entry = schema::schema_for(params.tag(), params.version())?;
    let mut items = Vec::with_capacity(entry.fields.len() + 2);
    items.push(rlp::Item::Bytes(crate::bytes::uint_to_bytes(
        &BigUint::from(entry.tag.as_u32()),
    )));
    items.push(rlp::Item::Bytes(crate::bytes::uint_to_bytes(
        &BigUint::from(entry.version),
    )));
    for (name, kind) in entry.fields {
        items.push(codec::serialize(
            name, kind, params, entry, options, overrides,
        )?);
    }
    Ok(rlp::encode(&rlp::Item::List(items)))
}

/// Parse a `tx_` string back to its parameters.
pub fn unpack_tx(encoded: &str) -> Result<TxParams> {
    unpack_tx_rlp(&encoding::decode(encoded)?)
}

/// Parse a `tx_` string, requiring it to carry `expected`.
pub fn unpack_tx_as(encoded: &str, expected: Tag) -> Result<TxParams> {
    let params = unpack_tx(encoded)?;
    if params.tag() != expected {
        return Err(Error::UnexpectedTag {
            expected: expected.as_u32(),
            actual: params.tag().as_u32(),
        });
    }
    Ok(params)
}

/// Parse a transaction's RLP bytes back to its parameters.
pub fn unpack_tx_rlp(bytes: &[u8]) -> Result<TxParams> {
    let items = rlp::decode(bytes)?;
    let items = items.as_list()?;
    if items.len() < 2 {
        return Err(Error::Rlp("record has no tag or version".into()));
    }
    let tag_value = crate::bytes::bytes_to_uint(items[0].as_bytes()?);
    let version = crate::bytes::bytes_to_uint(items[1].as_bytes()?);
    let tag = Tag::from_u32(
        u32::try_from(&tag_value).map_err(|_| Error::SchemaNotFound {
            tag: u32::MAX,
            version: None,
        })?,
    )?;
    let version = u32::try_from(&version).map_err(|_| Error::SchemaNotFound {
        tag: tag.as_u32(),
        version: None,
    })?;
    let entry = schema::schema_for(tag, Some(version))?;

    if items.len() != entry.fields.len() + 2 {
        return Err(Error::RecordLength {
            expected: entry.fields.len() + 2,
            actual: items.len(),
        });
    }

    let mut params = TxParams::new(tag).with_version(version);
    for ((name, kind), item) in entry.fields.iter().zip(&items[2..]) {
        params.set(name, codec::deserialize(name, kind, item)?);
    }
    Ok(params)
}

/// The `th_` hash of a signed transaction, from its `tx_` string.
pub fn transaction_hash(encoded_tx: &str) -> Result<String> {
    let bytes = encoding::decode(encoded_tx)?;
    crate::keys::transaction_hash(&bytes)
}
