//! FATE serialisation tags.
//!
//! Mirrors the tag scheme in `aeb_fate_encoding.erl`. The comments are the
//! protocol's own, kept verbatim so a reader can diff this table against the
//! reference without leaving the file.

/// `sxxxxxx 0` — 6 bit integer with sign bit.
pub const SMALL_INT: u8 = 0b0;
/// `000000 01` — FATE-integer encoded (size - 64), then the bytes.
pub const LONG_STRING: u8 = 0b0000_0001;
/// `xxxxxx 01` — inline bytes, when `0 < size < 64`.
pub const SHORT_STRING: u8 = 0b01;
/// `xxxx 0011` — inline elements, when `0 <= length < 16`.
pub const SHORT_LIST: u8 = 0b0011;

/// `0000 0111` — integer typedef.
pub const TYPE_INTEGER: u8 = 0b0000_0111;
/// `0001 0111` — boolean typedef.
pub const TYPE_BOOLEAN: u8 = 0b0001_0111;
/// `0010 0111` — list typedef, followed by the element type.
pub const TYPE_LIST: u8 = 0b0010_0111;
/// `0011 0111` — tuple typedef, followed by size and element types.
pub const TYPE_TUPLE: u8 = 0b0011_0111;
/// `0100 0111` — object typedef, followed by the object type byte.
pub const TYPE_OBJECT: u8 = 0b0100_0111;
/// `0101 0111` — bits typedef.
pub const TYPE_BITS: u8 = 0b0101_0111;
/// `0110 0111` — map typedef, followed by key and value types.
pub const TYPE_MAP: u8 = 0b0110_0111;
/// `0111 0111` — string typedef.
pub const TYPE_STRING: u8 = 0b0111_0111;
/// `1000 0111` — variant typedef, followed by size and the variant types.
pub const TYPE_VARIANT: u8 = 0b1000_0111;
/// `1001 0111` — bytes typedef, followed by a FATE-encoded size (`-1` = any).
pub const TYPE_BYTES: u8 = 0b1001_0111;
/// `1010 0111` — contract bytearray typedef.
pub const TYPE_CONTRACT_BYTEARRAY: u8 = 0b1010_0111;
/// `1110 0111` — type variable, followed by its id.
pub const TYPE_VAR: u8 = 0b1110_0111;
/// `1111 0111` — any typedef.
pub const TYPE_ANY: u8 = 0b1111_0111;

/// `0000 1011` — RLP encoded (size - 16), then the elements.
pub const LONG_TUPLE: u8 = 0b0000_1011;
/// `xxxx 1011` — inline elements, when `0 < size < 16`.
pub const SHORT_TUPLE: u8 = 0b1011;
/// `0001 1111` — RLP encoded (length - 16), then the elements.
pub const LONG_LIST: u8 = 0b0001_1111;
/// `0010 1111` — RLP encoded size, then `[key, value]` pairs.
pub const MAP: u8 = 0b0010_1111;
/// `0011 1111` — the empty tuple, also FATE unit.
pub const EMPTY_TUPLE: u8 = 0b0011_1111;
/// `0100 1111` — RLP encoded integer, read as a bitfield.
pub const POS_BITS: u8 = 0b0100_1111;
/// `0101 1111` — the empty string.
pub const EMPTY_STRING: u8 = 0b0101_1111;
/// `0110 1111` — RLP encoded (integer - 64).
pub const POS_BIG_INT: u8 = 0b0110_1111;
/// `0111 1111` — false.
pub const FALSE: u8 = 0b0111_1111;
/// `1000 1111` — FATE-encoded size, then the contract bytecode.
pub const CONTRACT_BYTEARRAY: u8 = 0b1000_1111;
/// `1001 1111` — object type byte, then an RLP encoded array.
pub const OBJECT: u8 = 0b1001_1111;
/// `1010 1111` — RLP encoded arities, tag byte, then the values as a tuple.
pub const VARIANT: u8 = 0b1010_1111;
/// `1011 1111` — RLP encoded store map id.
pub const MAP_ID: u8 = 0b1011_1111;
/// `1100 1111` — RLP encoded integer, read as an infinite-ones bitfield.
pub const NEG_BITS: u8 = 0b1100_1111;
/// `1101 1111` — reserved. Neither the reference encoder nor the reference
/// decoder handles this tag; see the crate docs.
pub const EMPTY_MAP: u8 = 0b1101_1111;
/// `1110 1111` — RLP encoded (integer - 64), negative.
pub const NEG_BIG_INT: u8 = 0b1110_1111;
/// `1111 1111` — true.
pub const TRUE: u8 = 0b1111_1111;

/// Object type: account address.
pub const OTYPE_ADDRESS: u8 = 0;
/// Object type: sized byte string.
pub const OTYPE_BYTES: u8 = 1;
/// Object type: contract address.
pub const OTYPE_CONTRACT: u8 = 2;
/// Object type: oracle address.
pub const OTYPE_ORACLE: u8 = 3;
/// Object type: oracle query id.
pub const OTYPE_ORACLE_QUERY: u8 = 4;
/// Object type: state channel address.
pub const OTYPE_CHANNEL: u8 = 5;

/// Values below this are encoded in the small-integer tag itself.
pub const SMALL_INT_SIZE: u64 = 64;
/// Strings shorter than this are encoded with an inline length.
pub const SHORT_STRING_SIZE: u64 = 64;
/// Tuples shorter than this are encoded with an inline size.
pub const SHORT_TUPLE_SIZE: u64 = 16;
/// Lists shorter than this are encoded with an inline length.
pub const SHORT_LIST_SIZE: u64 = 16;

/// True when the byte opens a type definition rather than a value.
pub fn is_type_tag(tag: u8) -> bool {
    matches!(
        tag,
        TYPE_INTEGER
            | TYPE_BOOLEAN
            | TYPE_ANY
            | TYPE_VAR
            | TYPE_LIST
            | TYPE_TUPLE
            | TYPE_OBJECT
            | TYPE_BITS
            | TYPE_BYTES
            | TYPE_MAP
            | TYPE_STRING
            | TYPE_VARIANT
            | TYPE_CONTRACT_BYTEARRAY
    )
}
