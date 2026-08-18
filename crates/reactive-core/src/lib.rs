//! æternity protocol primitives in Rust: the encoding substrate and transaction
//! serialisation.
//!
//! Bytes in, bytes out. There is no HTTP client here, no async, no retries and no
//! ergonomics layer — those belong to each language's own binding, in its own
//! idiom. What lives here is the part that has to be identical everywhere and
//! correct to the byte.
//!
//! ```
//! use reactive_core::encoding::{encode, Encoding};
//! use reactive_core::tx::{build_tx, unpack_tx, Tag, TxParams, Value};
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
//! # Ok::<(), reactive_core::Error>(())
//! ```
//!
//! # What this crate deliberately does not own
//!
//! - **The fee and gas model.** [`tx::FeeModel`] is the seam; the fixed point
//!   that derives a minimum fee from the size of the transaction it is a field of
//!   is implemented against that trait, not here.
//! - **State-tree entries.** A `poi` field round-trips as opaque bytes so the
//!   channel decode-and-re-encode path is byte-exact without this crate owning
//!   the entry schema or the Merkle-Patricia tree.
//! - **The Sophia FATE ABI.** Contract call data arrives here already encoded, as
//!   a `cb_` string.
//! - **Anything that needs a node.** Nonces, relative TTLs and oracle query fees
//!   are inputs, not lookups.

#![forbid(unsafe_code)]

pub mod aens;
pub mod bytes;
pub mod encoding;
mod error;
pub mod hash;
pub mod id;
pub mod protocol;
pub mod rlp;
pub mod signing;
pub mod tx;

pub use error::{Error, Result};
