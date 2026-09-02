//! FATE ABI encoding and decoding.
//!
//! Bytes in, bytes out. This crate implements the æternity VM's data
//! serialisation — the format contract calldata, call results, contract state
//! and chain events are written in — and nothing else. It does no I/O, no
//! hashing, no base58/base64 address encoding and no async, so it compiles to a
//! small WebAssembly component and has no dependencies.
//!
//! ```
//! use ae_fate::{deserialize, serialize, FateValue};
//!
//! let value = FateValue::string("hello");
//! let bytes = serialize(&value)?;
//! assert_eq!(deserialize(&bytes)?, value);
//! # Ok::<(), ae_fate::Error>(())
//! ```
//!
//! # What the model is, and is not
//!
//! [`FateValue`] mirrors the *wire* format, not Sophia's surface syntax. The
//! wire does not distinguish a record from a tuple, a set from a map to unit,
//! or a string from an unsized byte array, so neither does this crate.
//! Recovering the Sophia type of a decoded value needs the contract's declared
//! interface and belongs a layer above.
//!
//! # Which implementation this follows
//!
//! Where the reference Erlang implementation (`aeb_fate_encoding`,
//! `aeb_fate_data`) and the JavaScript library (`@aeternity/aepp-calldata`)
//! disagree, this crate follows the Erlang, because that is what the node runs
//! and therefore what the chain accepts. Four such disagreements are known and
//! are covered by tests in `tests/divergence.rs`:
//!
//! - **Negative zero.** The small-integer form with the sign bit set and a zero
//!   magnitude has a second encoding of zero. Erlang rejects it on decode; the
//!   JS library decodes it to zero. Rejected here. *Closed:* the JS library
//!   accepts the form but never writes it.
//! - **Non-canonical integers.** Erlang re-encodes every RLP integer it reads
//!   and rejects the input unless the bytes match, so a leading zero byte or
//!   the empty string is an error. The JS library accepts both. Rejected here.
//!   *Closed*, for the same reason.
//! - **String ordering.** Both order strings by length before content, but the
//!   JS library measures length in UTF-16 code units, so two strings whose byte
//!   lengths differ but whose code-unit lengths agree sort differently there.
//!   Length is measured in bytes here. *Closed* — it reaches every map with a
//!   non-ASCII string key, and the JS order is the one no chain accepts.
//! - **Bit-field ordering.** Erlang orders two negative bit fields numerically;
//!   the JS library reverses them. Numeric here. *Closed*, for the same reason,
//!   reaching every map keyed by `bits` that holds two negative keys.
//!
//! The last two looked like a compatibility choice between two live orderings
//! and are not one. `aebytecode` re-sorts every map it decodes and raises
//! `{unknown_map_serialization_format, …}` when the input was not already in
//! that order, so the chain accepts exactly one — the one written here. The JS
//! library validates no order on read, which is what made it look symmetric.
//!
//! The JS library also selects a key comparator from a map's *declared* key
//! type, so it has no cross-type order at all, while [`FateValue`]'s `Ord` needs
//! one to be total. That comes from the node's `?ORD_*` table in
//! `aeb_fate_data` instead, which `src/ord.rs` matches entry for entry. Sophia
//! maps are keyed by a single type, so no compiled contract reaches it.
//!
//! One tag is dead in both: `EMPTY_MAP` (`0b1101_1111`). Neither implementation
//! ever writes it — an empty map is `MAP` with a zero length — and the Erlang
//! decoder has no clause for it, so it is rejected here as an unknown tag even
//! though the JS type factory claims to recognise it.

#![forbid(unsafe_code)]
#![deny(missing_docs)]

mod calldata;
mod de;
mod error;
mod int;
mod ord;
mod rlp;
mod ser;
mod types;
mod value;

pub mod tag;

pub use calldata::{decode_calldata, encode_calldata, Calldata};
pub use de::{deserialize, deserialize_one};
pub use error::{Error, Result};
pub use int::FateInt;
pub use ser::serialize;
pub use types::{deserialize_type, deserialize_type_one, serialize_type, BytesSize, FateType};
pub use value::{AddressKind, FateMap, FateValue, FateVariant};
