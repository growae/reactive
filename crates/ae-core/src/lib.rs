//! æternity protocol primitives in Rust: bytes in, bytes out.
//!
//! There is no HTTP client here, no async, no retries and no ergonomics layer —
//! those belong to each language's own binding, in its own idiom. What lives
//! here is the part that has to be identical everywhere and correct to the byte.
//!
//! ```
//! use ae_core::encoding::{encode, Encoding};
//! use ae_core::tx::{build_tx, unpack_tx, Tag, TxParams, Value};
//!
//! let sender = encode(&[1u8; 32], Encoding::AccountAddress)?;
//! let recipient = encode(&[2u8; 32], Encoding::AccountAddress)?;
//!
//! let params = TxParams::new(Tag::SpendTx)
//!     .with("senderId", sender.as_str())
//!     .with("recipientId", recipient.as_str())
//!     .with("amount", 1_000_000_000_000_000_000u64)
//!     .with("fee", 16_660_000_000_000u64)
//!     .with("nonce", 1u64);
//!
//! let tx = build_tx(&params)?;
//! assert!(tx.starts_with("tx_"));
//! assert_eq!(unpack_tx(&tx)?.tag(), Tag::SpendTx);
//! # Ok::<(), ae_core::Error>(())
//! ```
//!
//! # Layout
//!
//! | Module | What it owns |
//! |---|---|
//! | [`encoding`], [`rlp`], [`hash`], [`id`], [`bytes`] | the encoding substrate everything else sits on |
//! | [`tx`] | transaction serialisation: the tag schemas, build and unpack |
//! | [`entry`] | the chain state entries and their versions |
//! | [`mpt`] | the Merkle-Patricia state tree and proofs of inclusion |
//! | [`fee`] | the fee and gas model, including the size/fee fixed point |
//! | [`keys`] | addresses, Ed25519 signing, the network-id binding |
//! | [`protocol`] | consensus constants, keyed by protocol version |
//! | [`aens`] | name hashing, commitments and the name fee |
//!
//! # What this crate deliberately does not own
//!
//! - **The Sophia FATE ABI.** That is `ae-fate`, a separate member of this
//!   workspace with no runtime dependencies. Contract call data arrives here
//!   already encoded, as a `cb_` string.
//! - **Anything that needs a node.** Nonces, relative TTLs and oracle query fees
//!   are inputs, not lookups.

pub mod aens;
pub mod bytes;
pub mod encoding;
pub mod entry;
mod error;
pub mod fee;
pub mod hash;
pub mod id;
pub mod keys;
pub mod mpt;
pub mod protocol;
pub mod rlp;
pub mod tx;

pub use error::{Error, Result};
