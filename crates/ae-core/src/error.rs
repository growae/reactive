//! The crate's single error type.
//!
//! The core is pure computation, so every failure is a malformed input or a
//! value that does not fit the protocol. There is deliberately no I/O variant.

use core::fmt;

/// Anything the core can refuse to do.
#[derive(Debug, Clone, PartialEq, Eq)]
#[non_exhaustive]
pub enum Error {
    /// RLP input was truncated, over-long, or not minimally encoded.
    Rlp(&'static str),
    /// An RLP item was a list where a byte string was expected, or vice versa.
    RlpShape {
        /// What the caller needed.
        expected: &'static str,
        /// What the input actually held.
        got: &'static str,
    },
    /// An api-encoded string had no `prefix_` separator, or an unknown prefix.
    UnknownEncoding(String),
    /// base58/base64 payload did not decode.
    BadPayload(&'static str),
    /// The trailing 4-byte double-sha256 checksum did not match.
    InvalidChecksum,
    /// A fixed-size payload had the wrong length.
    PayloadLength {
        /// Bytes the encoding requires.
        expected: usize,
        /// Bytes the input carried.
        got: usize,
    },
    /// An `id()` field carried a tag byte outside 1..=6.
    UnknownIdTag(u8),
    /// An entry carried a tag this build does not implement.
    UnknownEntryTag(u32),
    /// An entry carried a version not defined for its tag by the protocol.
    UnknownEntryVersion {
        /// The entry tag.
        tag: u32,
        /// The version found on the wire.
        version: u32,
    },
    /// An entry had the wrong number of RLP fields for its tag and version.
    EntryArity {
        /// The entry tag.
        tag: u32,
        /// Fields the template defines.
        expected: usize,
        /// Fields present on the wire.
        got: usize,
    },
    /// An integer field was longer than the target type, or not minimally encoded.
    IntegerRange(&'static str),
    /// An enumeration field carried a value outside its defined set.
    UnknownEnumValue {
        /// Which field.
        field: &'static str,
        /// The value found.
        value: u64,
    },
    /// A Merkle-Patricia node did not hash to the key it was filed under.
    MerkleHashMismatch,
    /// A Merkle-Patricia node referenced a hash that is not in the proof.
    MerkleNodeMissing(&'static str),
    /// A Merkle-Patricia node had a length that is not 2 or 17.
    MerkleNodeArity(usize),
    /// A Merkle-Patricia path prefix nibble was above 3.
    MerklePathNibble(u8),
    /// Ed25519 rejected the key or signature bytes.
    Crypto(&'static str),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Rlp(why) => write!(f, "malformed RLP: {why}"),
            Self::RlpShape { expected, got } => write!(f, "expected RLP {expected}, got {got}"),
            Self::UnknownEncoding(prefix) => write!(f, "unknown encoding prefix: {prefix}"),
            Self::BadPayload(why) => write!(f, "undecodable payload: {why}"),
            Self::InvalidChecksum => write!(f, "checksum mismatch"),
            Self::PayloadLength { expected, got } => {
                write!(f, "payload should be {expected} bytes, got {got}")
            }
            Self::UnknownIdTag(tag) => write!(f, "unknown id tag: {tag}"),
            Self::UnknownEntryTag(tag) => write!(f, "unknown entry tag: {tag}"),
            Self::UnknownEntryVersion { tag, version } => {
                write!(f, "entry {tag} has no version {version}")
            }
            Self::EntryArity {
                tag,
                expected,
                got,
            } => write!(f, "entry {tag} takes {expected} fields, got {got}"),
            Self::IntegerRange(why) => write!(f, "integer out of range: {why}"),
            Self::UnknownEnumValue { field, value } => {
                write!(f, "field {field} has no variant {value}")
            }
            Self::MerkleHashMismatch => write!(f, "merkle tree node hash mismatch"),
            Self::MerkleNodeMissing(where_) => write!(f, "missing node in tree: {where_}"),
            Self::MerkleNodeArity(len) => write!(f, "merkle node of unknown length: {len}"),
            Self::MerklePathNibble(nibble) => write!(f, "unknown path nibble: {nibble}"),
            Self::Crypto(why) => write!(f, "crypto: {why}"),
        }
    }
}

impl std::error::Error for Error {}

/// Shorthand for a core result.
pub type Result<T> = core::result::Result<T, Error>;
