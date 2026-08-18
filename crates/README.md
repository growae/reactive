# crates

The Rust core: æternity protocol primitives written once, so every language
binding shares one implementation instead of five.

| Crate | What it owns |
|---|---|
| `ae-core` | RLP, the `xx_` api encoding, the `id` type, blake2b-256, Ed25519 with the network-id prefix rule, transaction serialisation for all 26 tags, the state entries and their trees, and the fee and gas model |
| `ae-fate` | Sophia FATE ABI encode and decode. No runtime dependencies — its byte-string RLP is a deliberate strict subset, pinned to `ae-core`'s by a dev-only agreement test |

Nothing here is published. The workspace is `publish = false` and stays that way.

**Named `ae-`, not `reactive-`.** The protocol layer is not `reactive`'s: the JS
binding will one day depend on it, and so will the Python and Dart ones. Naming
it after one binding's brand would be backwards.

## Where this sits

The core is **pure computation** — bytes in, bytes out. No HTTP client, no async,
no retries, no ergonomics layer. Those belong to each language's binding, in its
own idiom, because that layer is what makes a library pleasant and it does not
survive a trip through an FFI boundary.

`packages/core` continues to run on `@aeternity/aepp-sdk`. This crate is built
*behind* it and replaces nothing until a differential suite proves byte-identical
output across every transaction type in use.

## Layout — decided

`crates/` at the repository root, one Cargo workspace, one `Cargo.lock`, one
`target/`, was chosen so that:

- the pnpm workspace globs (`packages/*`, `site`, `playgrounds/*`) do not pick it
  up and try to treat it as a JS package;
- there is no `Cargo.toml` at the repository root, next to the JS tooling config;
- `cargo` commands run from one place regardless of how many crates land later.

The alternative — a package inside `packages/` — keeps everything under one
directory but puts a non-JS package inside a glob that means "JS package here".

The Technical Lead settled this, along with the crate names and the rule for
resolving an overlap between two crates: whichever row owns the surface in its
title keeps it, and the other copy is deleted rather than reconciled.

Lints are set once, in `[workspace.lints]`, and inherited by every member with
`[lints] workspace = true`: `unsafe_code = "forbid"`, `missing_docs = "deny"`,
`clippy::all = "deny"`. The toolchain is pinned in `rust-toolchain.toml` to an
exact version rather than `stable`, so the gate cannot go red without a commit.

## Seams this crate deliberately leaves open

Each of these is owned by another workstream. The crate names the boundary rather
than guessing across it.

| Seam | Shape here | Owner |
|---|---|---|
| Fee and gas model | **Filled.** `fee` owns the model; `fee::RebuildTx` is the seam that keeps the size/fee fixed point testable without a whole transaction, and `tx::FeeModel` remains the seam `build_tx` calls through | `fee` |
| State-tree entries | **Filled.** `entry` and `mpt`. A `poi` transaction field still round-trips as opaque bytes on the `tx` side, so the channel decode-and-re-encode path stays byte-exact either way | `entry`, `mpt` |
| Sophia FATE ABI | Call data arrives already encoded, as a `cb_` string | `ae-fate` |
| Anything needing a node | Nonces, relative TTLs and oracle query fees are inputs, not lookups | each language's binding |

## Building and testing

```
cd crates
cargo test --workspace                              # what CI runs
cargo clippy --workspace --all-targets -- -D warnings
cargo fmt --all --check
```

`cargo test` is offline and needs no node and no network.

## The vector corpus

`ae-core/tests/vectors/transactions.json` holds transactions built by
`@aeternity/aepp-sdk`, together with the parameters that produced them. The Rust
tests rebuild each one and assert the `tx_` strings are identical.

Regenerate it after an SDK bump — the diff *is* the changelog of what the bump
changed on the wire:

```
# from a directory where @aeternity/aepp-sdk resolves
node generate-vectors.mjs > vectors/transactions.json
```

### Which pairs the sdk may be asked about

`ae_core::entry::SCHEMA_ENTRIES` marks each of the 25 tag/version pairs
`Covered` or `NodeOnly`. The harness derives its restriction from that table
rather than keeping its own list, which would go stale the first time
`@aeternity/aepp-sdk` ships a version. Two pairs are `NodeOnly` today —
`Account` v3 and `ContractCall` v3 — and for those the sdk is not an oracle:
assert against node-derived fixtures, and never score its absence as a core
failure.

One trap for whoever writes the generator: a round trip cannot reach `Account`
v3, because the encoder writes v1 for any zero-flags account. Those cases have
to be constructed with flags set explicitly.

This is a floor, not the differential harness. The harness adds the fee fixed
point with the field omitted, the FATE ABI corpus, and a node in the loop as a
third opinion — without which the failure mode where both implementations agree
and are both wrong stays invisible.

## Test keys

Every address in the tests is a constant byte pattern and every private key is a
published protocol test vector (RFC 8032 §7.1). No real key material is read,
written or referenced anywhere in this tree, and nothing here signs against a
live chain.
