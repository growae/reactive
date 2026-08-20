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

## The public surface is frozen, and changing it costs three edits elsewhere

**Read this before you change a signature in `ae-core` or `ae-fate`.**

There is no single interface definition these crates are bound through. WIT is
read by exactly one of the four targets. The other two bind the Rust surface
directly and each carries a **hand-maintained mirror** of every public type:

| Target | Binding | Reads the WIT? | What one signature change costs |
|---|---|---|---|
| Browser JS | `jco`, WASM component | yes | the WIT interface, regenerated |
| Python | PyO3, native | **no** | a hand-written `#[pyclass]`/`#[pymethods]` mirror |
| Dart / Flutter | `flutter_rust_bridge`, native | **no** | a hand-written mirror plus regenerated Dart |
| Rust | it is a crate | n/a | nothing |

So one changed signature is **three simultaneous binding edits, forever**, and
they land in three repositories' worth of review. That is the tax the freeze
exists to keep bounded — not a preference about churn.

### The protocol

1. **Any change to the public surface goes to the Technical Lead before it is
   written**, not after. Bring the signature, the reason, and the binding cost
   in the terms of the table above — which mirrors move, and whether any of them
   needs a type that does not exist on the other side yet.
2. **Additive is not automatically free.** A new public type is a new mirror in
   Python and in Dart, and it is permanent: the surface only ever grows, because
   removing something is itself a breaking change. A new *variant* on an existing
   enum is worse than a new function — every mirror's match arms move with it.
   `tx::Value` is the widest type here and the most expensive to widen.
3. **Widening what we accept is a change, not a fix.** Making a verifier,
   decoder or validator take input it previously rejected is a security-relevant
   decision even when it makes a test pass. Say so explicitly when you bring it.
4. **A change that loosens a type is a regression** even when the runtime
   behaviour is identical. The whole value of this layer is that the types are
   right end to end.
5. **Nothing here is a place to put ergonomics.** If a change is only convenient,
   it belongs in the binding, in that language's idiom — which is where it will
   read better anyway.

### What is not a surface change

Internals, private helpers, `pub(crate)` items, test code, documentation, and
the vector and chain corpora. Adding a test is always free. So is anything that
changes what a function *computes* without changing what it *accepts or
returns* — but if that computation is protocol behaviour, it is a consumer-facing
change and it goes in the release note whether or not the Technical Lead has to
rule on it.

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

## The chain corpus

`ae-core/tests/vectors/chain.json` is the other half of that argument, and it is
the half the SDK cannot supply: 181 transactions **a node already accepted and
mined**, harvested from the middleware on mainnet and testnet, spanning every one
of the 25 tags a transaction can be mined as. Each carries the signed bytes, the
signatures it was included with, the `th_` the chain indexed it by, the node's
own decoding, and the protocol version at its height.

`ae-core/tests/chain.rs` re-encodes every one byte-identical, hashes it, verifies
its signatures, checks our decoding field by field against the node's, and holds
the fee model against fees a node actually took. Two things it found are written
up in that file's module docs and in the tests themselves, because neither is
visible from an offline corpus. Both are now fixed, and each is a behaviour
change a consumer can see — lift the two bullets below into the release note:

- **A node verifies a signature against two payloads**, `network_id ++ tx` and
  `network_id ++ blake2b_256(tx)`. `keys::PublicKey::verify_transaction` now
  accepts both, as a node does; it used to answer `false` for a quarter of the
  signatures on chain, including everything the node's own state-channel FSM
  signs. **Signing is unchanged** — this crate emits the hashed payload and
  nothing else, matching `@aeternity/aepp-sdk`. Accepting both is not licence to
  emit both, and `keys` has no way to produce a plain-payload signature.
- **The node prices a contract call's base gas by its ABI version** — 12× base
  gas for FATE, 30× for AEVM and for any ABI it does not recognise. `fee` now
  does the same, and `TxGasInputs` carries an `abi_version` for it.
  `transaction_base_gas` takes `TxGasInputs` rather than a `Tag`, and the WASM
  binding's `fee.estimate-gas` takes `abi-version: option<u8>` as a last
  parameter. **An unset `abi_version` is charged the 30× rate**, on purpose: too
  low is `too_low_fee` and a rejected transaction, too high is accepted, so the
  unknown case takes the answer that cannot fail. Neither `TxGasInputs::new` nor
  an omitted `abi-version` will quietly pick FATE — pass the ABI for a contract
  call or pay 2.5× more than you need to.

The second one is the first place this crate knowingly stops matching
`@aeternity/aepp-sdk`, which keys its `TX_BASE_GAS` on the tag alone. **The node
is the specification; the SDK is a cross-check.** Parity with the SDK was only
ever a proxy for *a node will accept this*, and where the proxy and the thing
itself disagree, the thing wins and the divergence gets recorded here.

**These two bullets have a shelf life, and it is the price of not keeping a
changelog.** They are written in the tense of a change — "now accepts", "used to
answer" — because their job is to be lifted verbatim into the CHANGELOG of
whichever package ships them. Once one has been, rewrite it here in the present
tense to say what the crate *does*, and let git hold the change record.
Otherwise this section becomes a changelog by accretion, which is the file we
deliberately do not have.

Regenerating the corpus is a harvest from the middleware, and the diff is the
record of what the chain started doing differently. It is public chain data: no
key material is read, written or referenced, every signature is checked with a
public key that is already on chain, and nothing in that file signs anything.

## Test keys

Every address in the tests is a constant byte pattern and every private key is a
published protocol test vector (RFC 8032 §7.1). No real key material is read,
written or referenced anywhere in this tree, and nothing here signs against a
live chain.
