//! Encoding primitives this crate's protocol modules sit on.
//!
//! **Provisional, and deliberately so.** The encoding substrate — RLP,
//! base58check with the full prefix table, the `id()` type, blake2b-256 — is
//! owned by the transaction-serialisation line, not by this one. What is here
//! is the minimum the entry, fee and key modules need in order to be written
//! and tested now, kept behind a narrow surface so that replacing it with the
//! substrate line's implementation is a mechanical swap and not a rewrite.
//!
//! Nothing outside this module reaches for `bs58`, `base64`, `sha2` or `blake2`
//! directly. Two lines cannot both own the same bytes, so if the substrate line
//! lands a different RLP shape, this module goes and the callers keep compiling
//! against the same function names.

pub mod encoding;
pub mod hash;
pub mod id;
pub mod rlp;
