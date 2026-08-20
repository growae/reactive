//! The differential parity harness — the instrument, not the thing measured.
//!
//! `ae-core` and `ae-fate` prove themselves against two committed corpora
//! generated from the reference JavaScript implementations. That is a floor, and
//! on its own it is easy to misread: a suite where every committed vector passes
//! reports green whether it covers three tags or twenty-six, and says nothing at
//! all about the surface nobody wrote a vector for.
//!
//! This crate answers the question the suite cannot: **what is covered, what is
//! not, and by whom.** It produces a matrix rather than a number, because the
//! decision it feeds — whether the reference sdk can be dropped — turns entirely
//! on the uncovered rows.
//!
//! # The three halves
//!
//! 1. **Offline** — [`matrix::compute`], deterministic, no network. Rebuilds every
//!    committed vector through the crates under test and reports coverage across
//!    four independent surfaces.
//! 2. **Drift** — `regenerate.mjs`, which reinstalls the pinned reference versions,
//!    regenerates both corpora and fails on any difference. Without it
//!    "byte-identical" decays silently on the first dependency bump.
//! 3. **On-node** — [`sign::signed_corpus`] plus `node-exercise.mjs`. An offline
//!    byte-diff proves we agree with the reference sdk; it does not prove the node
//!    accepts what we build, and the node is the authority.
//!
//! # What this crate must never become
//!
//! It reports gaps; it does not fill them. A tag with no vector is a finding
//! handed to whoever owns that surface — adding the vector here and then scoring
//! it green is the failure mode the whole instrument exists to prevent.

pub mod corpus;
pub mod matrix;
pub mod render;
pub mod scope;
pub mod sign;
pub mod unpack;
