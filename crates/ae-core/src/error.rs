//! The crate's single error type.

use thiserror::Error;

/// Result alias used across the crate.
pub type Result<T> = core::result::Result<T, Error>;

/// Everything that can go wrong encoding or decoding an aeternity artifact.
#[derive(Debug, Error, PartialEq, Eq, Clone)]
pub enum Error {
    /// An `xx_...` string was not shaped like `prefix_payload`.
    #[error("encoded string is malformed: {0}")]
    Decode(String),

    /// The prefix of an `xx_...` string is not one of the known encodings.
    #[error("unknown encoding prefix: {0}")]
    UnknownPrefix(String),

    /// base58 or base64 payload could not be decoded.
    #[error("invalid {kind} payload: {reason}")]
    InvalidPayload {
        /// `base58` or `base64`.
        kind: &'static str,
        /// Underlying reason.
        reason: String,
    },

    /// The trailing 4-byte double-sha256 checksum did not match.
    #[error("invalid checksum")]
    InvalidChecksum,

    /// A fixed-width encoding carried the wrong number of bytes.
    #[error("payload should be {expected} bytes, got {actual} instead")]
    PayloadLength {
        /// Byte length the encoding requires.
        expected: usize,
        /// Byte length actually seen.
        actual: usize,
    },

    /// RLP input was not canonical or ran out of bytes.
    #[error("invalid rlp: {0}")]
    Rlp(String),

    /// An RLP item was a list where a byte string was expected, or vice versa.
    #[error("expected an rlp {expected}")]
    RlpShape {
        /// `byte string` or `list`.
        expected: &'static str,
    },

    /// No transaction schema exists for this tag, or for this tag at this version.
    #[error("no schema for tag {tag} version {version:?}")]
    SchemaNotFound {
        /// The numeric transaction tag.
        tag: u32,
        /// The serialised version, when one was supplied.
        version: Option<u32>,
    },

    /// A required field was absent from the parameters.
    #[error("field `{0}` is required")]
    MissingField(&'static str),

    /// A field held a value of the wrong shape for its codec.
    #[error("field `{field}`: expected {expected}")]
    FieldType {
        /// Field name from the schema.
        field: &'static str,
        /// What the codec wanted.
        expected: &'static str,
    },

    /// A field held a syntactically valid but semantically rejected value.
    #[error("field `{field}`: {reason}")]
    FieldValue {
        /// Field name from the schema.
        field: &'static str,
        /// Why it was rejected.
        reason: String,
    },

    /// The decoded tag did not match the tag the caller asked for.
    #[error("expected tag {expected}, got {actual} instead")]
    UnexpectedTag {
        /// Tag the caller asked for.
        expected: u32,
        /// Tag actually present.
        actual: u32,
    },

    /// The RLP record had a different number of items than the schema.
    #[error("rlp length: expected {expected}, got {actual}")]
    RecordLength {
        /// Field count from the schema.
        expected: usize,
        /// Item count in the RLP.
        actual: usize,
    },

    /// An AENS name was rejected.
    #[error("aens name: {0}")]
    Name(String),

    /// A field needs a model this crate deliberately does not own.
    ///
    /// The fee/gas model is a separate workstream; see [`crate::tx::FeeModel`].
    #[error("field `{field}` was not provided and computing it needs the {model} model")]
    ModelRequired {
        /// Field name from the schema.
        field: &'static str,
        /// Which model would have supplied it.
        model: &'static str,
    },

    /// A Merkle-Patricia node did not hash to the key it was filed under.
    ///
    /// The whole point of a proof of inclusion: a node that does not rehash to
    /// its own key proves nothing, so it is rejected on parse rather than
    /// answered from.
    #[error("merkle tree node hash mismatch")]
    MerkleHashMismatch,

    /// A Merkle-Patricia node referenced a hash the proof does not carry.
    ///
    /// Only for references that make the proof unwalkable. A branch missing a
    /// child is the normal shape of a partial proof and is reported by
    /// `MerklePatriciaTree::is_complete` instead.
    #[error("missing node in merkle tree: {0}")]
    MerkleNodeMissing(&'static str),

    /// A Merkle-Patricia node had a length other than 2 or 17.
    #[error("merkle node of unknown length: {0}")]
    MerkleNodeArity(usize),

    /// A Merkle-Patricia path header carried a nibble above 3.
    #[error("unknown merkle path nibble: {0}")]
    MerklePathNibble(u8),

    /// Signature verification input was not a valid Ed25519 key or signature.
    #[error("crypto: {0}")]
    Crypto(String),
}
