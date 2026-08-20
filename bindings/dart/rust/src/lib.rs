//! `flutter_rust_bridge` binding over `ae-core`'s protocol primitives.
//!
//! Native, not WASM — `flutter_rust_bridge` binds the Rust core directly and
//! never reads a WIT file, so this binding is independent of the browser
//! component pipeline, same as `bindings/python`.
//!
//! The surface mirrors `ae_core::tx::Value`'s eight shapes and `TxParams`
//! exactly, plus the address/signing operations from `ae_core::keys` and the
//! fee model's joined entry point — the same scope `bindings/python` binds,
//! for the same reason: a caller building and signing a transaction never
//! touches `mpt`, `protocol`, `aens`'s internals, or `rlp` directly.

pub mod api;
mod frb_generated;
