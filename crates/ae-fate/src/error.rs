//! Errors raised while reading or writing FATE data.

use core::fmt;

/// Everything that can go wrong decoding a FATE byte sequence.
///
/// Encoding is total for any value this crate can construct, so it returns no
/// error — the one exception is a variant whose tag does not match its arities,
/// which is rejected at construction time by [`crate::FateValue::variant`].
#[derive(Clone, Debug, PartialEq, Eq)]
#[non_exhaustive]
pub enum Error {
    /// The input ended in the middle of a value.
    UnexpectedEnd,
    /// A byte sequence decoded correctly but had bytes left over.
    TrailingBytes {
        /// How many bytes were left unread.
        remaining: usize,
    },
    /// The leading byte is not a tag this protocol version defines.
    UnknownTag(u8),
    /// `OBJECT` was followed by an object type byte that is not defined.
    UnknownObjectType(u8),
    /// An RLP item was not in its canonical form.
    NonCanonicalRlp,
    /// An RLP list appeared where FATE only ever writes a byte string.
    RlpListUnsupported,
    /// An integer was RLP encoded with a leading zero byte, or as the empty
    /// string. The reference decoder re-encodes and compares, which rejects
    /// both.
    NonCanonicalInteger,
    /// The small-integer form was used with the sign bit set and a zero
    /// magnitude, which has two encodings and is therefore illegal.
    NegativeZero,
    /// `NEG_BITS` carried a zero magnitude; zero is only encodable as
    /// `POS_BITS`.
    NegativeZeroBits,
    /// A length or size field was negative.
    NegativeLength,
    /// A length or size field did not fit in the platform's address space.
    LengthOverflow,
    /// `OBJECT`/`OTYPE_BYTES` was not followed by a FATE string.
    ExpectedString,
    /// The payload of a variant was not a tuple.
    ExpectedTuple,
    /// A variant's tag does not index its arity list.
    VariantTagOutOfRange {
        /// The tag that was read.
        tag: u8,
        /// How many arities the variant declared.
        arities: usize,
    },
    /// A variant's payload size does not match the arity its tag selects.
    VariantArityMismatch {
        /// The tag that was read.
        tag: u8,
        /// The arity the tag selects.
        expected: u8,
        /// The number of values actually present.
        found: usize,
    },
    /// A map's entries were not in the protocol's canonical key order.
    MapNotSorted,
    /// A map contained the same key twice.
    DuplicateMapKey,
    /// A map was used as a key in another map, which the protocol forbids.
    MapAsMapKey,
    /// A `bytes(n)` type declared a size that is neither `-1` nor a
    /// representable non-negative length.
    InvalidBytesSize,
    /// A type variable id did not fit in a byte, or a tuple/variant declared
    /// more than 255 members.
    TypeTooWide,
    /// The decimal string was not a valid integer.
    InvalidInteger,
    /// The bytes are not a calldata pair of a function id and an argument
    /// tuple.
    MalformedCalldata,
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::UnexpectedEnd => write!(f, "input ended in the middle of a value"),
            Error::TrailingBytes { remaining } => {
                write!(f, "{remaining} trailing byte(s) after a complete value")
            }
            Error::UnknownTag(tag) => write!(f, "unknown FATE tag {tag:#010b}"),
            Error::UnknownObjectType(t) => write!(f, "unknown FATE object type {t}"),
            Error::NonCanonicalRlp => write!(f, "non-canonical RLP encoding"),
            Error::RlpListUnsupported => write!(f, "RLP list where a byte string was expected"),
            Error::NonCanonicalInteger => write!(f, "non-canonical integer encoding"),
            Error::NegativeZero => write!(f, "negative zero is not a legal small integer"),
            Error::NegativeZeroBits => write!(f, "zero is not encodable as negative bits"),
            Error::NegativeLength => write!(f, "negative length"),
            Error::LengthOverflow => write!(f, "length does not fit in usize"),
            Error::ExpectedString => write!(f, "expected a FATE string"),
            Error::ExpectedTuple => write!(f, "expected a FATE tuple"),
            Error::VariantTagOutOfRange { tag, arities } => {
                write!(f, "variant tag {tag} out of range for {arities} arities")
            }
            Error::VariantArityMismatch {
                tag,
                expected,
                found,
            } => write!(
                f,
                "variant tag {tag} has arity {expected} but carried {found} values"
            ),
            // Overwhelmingly this is calldata built by `@aeternity/aepp-calldata`,
            // which sorts non-ASCII string keys and negative bit-field keys into
            // an order the node rejects, so the message names that before the
            // reader goes looking for a corrupt byte. No separate variant: the
            // bytes are indistinguishable from any other unsorted map, and a
            // diagnostic is not worth widening the public surface for.
            Error::MapNotSorted => write!(
                f,
                "map entries are not in canonical key order \
                 (aepp-calldata orders non-ASCII string keys and negative bit-field keys \
                 differently to the node)"
            ),
            Error::DuplicateMapKey => write!(f, "duplicate map key"),
            Error::MapAsMapKey => write!(f, "a map cannot be used as a map key"),
            Error::InvalidBytesSize => write!(f, "invalid size in a bytes type"),
            Error::TypeTooWide => write!(f, "type has more members than the format can encode"),
            Error::InvalidInteger => write!(f, "not a valid decimal integer"),
            Error::MalformedCalldata => write!(f, "not a function id and argument tuple"),
        }
    }
}

impl std::error::Error for Error {}

/// Result of any fallible FATE operation.
pub type Result<T> = core::result::Result<T, Error>;
