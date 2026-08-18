# crates

The Rust core: æternity protocol primitives written once, so every language
binding shares one implementation instead of five.

| Crate | What it owns |
|---|---|
| `reactive-core` | RLP, the `xx_` api encoding, the `id` type, blake2b-256, Ed25519 with the network-id prefix rule, and transaction serialisation for all 26 tags |
| `ae-fate` | FATE ABI encode and decode: every value and type form in the tag space, the protocol's canonical map ordering, and calldata assembly. No dependencies |

### Two RLP codecs, on purpose

`reactive-core/src/rlp.rs` is a general `Item` codec with lists. `ae-fate/src/rlp.rs`
is byte strings and magnitudes only, and rejects an RLP list outright, because
FATE never writes one and a decoder that accepts one accepts a non-canonical
encoding. Sharing the first would drag `bs58`, `blake2`, `ed25519-dalek` and
`num-bigint` into the crate whose empty dependency list is the point.

**The standing condition:** the two must agree on length-prefix rules
permanently. A change to that logic in either file is a change to both.

Nothing here is published. The workspace is `publish = false` and stays that way.

## Where this sits

The core is **pure computation** — bytes in, bytes out. No HTTP client, no async,
no retries, no ergonomics layer. Those belong to each language's binding, in its
own idiom, because that layer is what makes a library pleasant and it does not
survive a trip through an FFI boundary.

`packages/core` continues to run on `@aeternity/aepp-sdk`. This crate is built
*behind* it and replaces nothing until a differential suite proves byte-identical
output across every transaction type in use.

## Layout — open, and the Technical Lead's call

`crates/` at the repository root, with its own Cargo workspace, was chosen so
that:

- the pnpm workspace globs (`packages/*`, `site`, `playgrounds/*`) do not pick it
  up and try to treat it as a JS package;
- there is no `Cargo.toml` at the repository root, next to the JS tooling config;
- `cargo` commands run from one place regardless of how many crates land later.

The alternative — a package inside `packages/` — keeps everything under one
directory but puts a non-JS package inside a glob that means "JS package here".

This is a repository-structure decision and it is not settled by this file. If
the layout should be different, moving it is a `git mv` plus one path in
`biome.json`.

## Seams this crate deliberately leaves open

Each of these is owned by another workstream. The crate names the boundary rather
than guessing across it.

| Seam | Shape here | Owner |
|---|---|---|
| Fee and gas model | `tx::FeeModel` — a trait with the fixed point spelled out. Without an implementation, `fee` and `gasLimit` must be explicit and are otherwise an error naming the model | fee/gas workstream |
| State-tree entries | A `poi` field round-trips as opaque bytes, so the channel decode-and-re-encode path is byte-exact without owning the entry schema or the Merkle-Patricia tree | entry/state-trees workstream |
| Sophia FATE ABI | `ae-fate` owns the bytes. `reactive-core` still takes call data already encoded, as a `cb_` string; the `cb_` envelope and the Blake2b function id are the encoding substrate's, not `ae-fate`'s | FATE ABI workstream |
| Anything needing a node | Nonces, relative TTLs and oracle query fees are inputs, not lookups | each language's binding |

## Building and testing

```
cd crates
cargo test              # unit tests, byte-parity vectors, behavioural tests
cargo clippy --all-targets
cargo fmt --all -- --check
```

`cargo test` is offline and needs no node and no network.

## The vector corpus

`reactive-core/tests/vectors/transactions.json` holds transactions built by
`@aeternity/aepp-sdk`, together with the parameters that produced them. The Rust
tests rebuild each one and assert the `tx_` strings are identical.

Regenerate it after an SDK bump — the diff *is* the changelog of what the bump
changed on the wire:

```
# from a directory where @aeternity/aepp-sdk resolves
node generate-vectors.mjs > vectors/transactions.json
```

This is a floor, not the differential harness. The harness adds the fee fixed
point with the field omitted, the FATE ABI corpus, and a node in the loop as a
third opinion — without which the failure mode where both implementations agree
and are both wrong stays invisible.

## Test keys

Every address in the tests is a constant byte pattern and every private key is a
published protocol test vector (RFC 8032 §7.1). No real key material is read,
written or referenced anywhere in this tree, and nothing here signs against a
live chain.
