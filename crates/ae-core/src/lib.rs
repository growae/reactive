//! The æternity protocol core: bytes in, bytes out.
//!
//! No sockets, no async, no retries, no ergonomics layer — those belong to each
//! language's own binding, not here.
//!
//! What this crate holds today:
//!
//! | Module | What it owns |
//! |---|---|
//! | [`protocol`] | consensus constants and transaction tags, keyed by protocol version |
//! | [`fee`] | the fee and gas model, including the size/fee fixed point |
//! | [`keys`] | addresses, Ed25519 signing, the network-id binding |
//! | [`entry`] | the chain state entries and their versions |
//! | [`mpt`] | the Merkle-Patricia state tree and proofs of inclusion |
//! | [`substrate`] | **provisional** encoding primitives the above sit on |
//!
//! Transaction serialisation and the Sophia FATE ABI are separate lines and are
//! not here. [`substrate`] exists so that this crate's protocol modules could be
//! written and tested before the serialisation line landed; it is meant to be
//! deleted, not grown.

#![forbid(unsafe_code)]
#![warn(missing_docs)]

pub mod entry;
pub mod error;
pub mod fee;
pub mod keys;
pub mod mpt;
pub mod protocol;
pub mod substrate;

pub use error::{Error, Result};
