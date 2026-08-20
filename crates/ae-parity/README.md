The differential parity harness — the instrument that decides when the reference
JavaScript SDK can be dropped, and the definition of "green" that decision gets
cited against.

It does not fix what it reports. Every uncovered row below is a finding for
whoever owns that surface; filling a gap here and then scoring it green is the
one failure mode this whole thing exists to prevent.

## What parity green means

One sentence, precise enough to be used as a gate by someone who was not here:

> **Parity green**, at a named head SHA and against the reference versions the
> two corpora record for themselves, means all six of:
>
> 1. every transaction schema entry has at least one committed vector, and
>    `ae-core` reproduces every vector's `tx_` string byte-for-byte **and**
>    survives unpack-then-rebuild;
> 2. every field in `TX_SCHEMA` is set by at least one vector, and every entry
>    carrying a fee has at least one vector with `fee` **omitted**, so the fee
>    fixed point is exercised rather than replayed;
> 3. every state-tree entry pair has at least one committed fixture that decodes
>    and re-encodes — from the reference SDK where it implements the pair, and
>    from a node where it does not;
> 4. every `FateValue` and `FateType` variant has at least one committed vector,
>    and every vector in the FATE corpus decodes and re-encodes byte-for-byte;
> 5. regenerating both corpora at their pinned reference versions produces no
>    diff;
> 6. on a node: every transaction we build is accepted by the node's decoder, and
>    every tag the node has a builder for produces bytes identical to ours — with
>    the control cases proving the node rejects corrupted bytes differently.

Points 1, 2, 4 and 5 are enforced in CI. Point 3 has no fixtures at all today.
Point 6 needs a reachable node and is recorded in `TESTNET.md` rather than gated,
because a public testnet going down is not a reason to fail a pull request.

**None of these is a percentage.** A percentage over four surfaces of different
sizes answers no question anyone has, and it hides exactly the rows that decide
whether the dependency can go.

## Running it

```
# The offline half. Deterministic, no network. Rewrites MATRIX.md and matrix.json.
cargo run -p ae-parity -- matrix

# The gate, including the check that the committed matrix is the one this produces.
cargo test -p ae-parity

# Drift: reinstall the pinned references, regenerate both corpora, diff.
node ae-parity/regenerate.mjs
node ae-parity/regenerate.mjs --write   # on a deliberate bump, to get the diff

# The on-node half. Generates a throwaway key, spends nothing.
cargo run -p ae-parity -- sign --out ae-parity/signed.json
node ae-parity/node-exercise.mjs --signed ae-parity/signed.json --out ae-parity/node.json
cargo run -p ae-parity -- matrix --node ae-parity/node.json
```

`signed.json` and `node.json` are outputs, not inputs, and are not committed.

## Why the on-node half exists

The offline half proves we agree with `@aeternity/aepp-sdk`. It cannot prove the
node agrees with either of us, and the node is the authority. That is not a
theoretical concern here: the protocol spec and the reference SDK already
disagree about two state-tree entry versions, and a harness that treats the SDK
as ground truth would score the *correct* implementation as the failure.

`node-exercise.mjs` therefore does three things, and the third is what makes the
second mean anything:

| | What it measures |
|---|---|
| **built** | the node's own Erlang builders behind `/v3/debug/…`, same parameters in, bytes compared. A third implementation, not a second opinion from the same family. |
| **accepted** | every vector rebuilt through this core, signed by a key generated for the run, posted. The rejection is expected; *which* rejection says whether the decoder took our bytes. |
| **controls** | deliberately corrupted transactions posted the same way. If a broken transaction is not rejected as broken, the row above measured nothing, and the script exits non-zero. |

Nothing is ever included in a micro-block: the signer is generated per run, has
never held a balance, and every posted transaction is rejected before the mempool.
No key material in this repository is read or used, and the debug builders return
bytes without touching state.

## The node's rejection taxonomy

Measured against the controls rather than read from documentation. Every row is
HTTP 400, which is why the code and not the status is what gets classified.

| `error_code` | What it means for our bytes |
|---|---|
| `invalid_encoding` | the base64check envelope is malformed — never reached the decoder |
| `broken_tx` | **the decoder refused our bytes.** The only rejecting verdict |
| `signature_check_failed` | fully decoded, signer identified, signature checked — accepted |
| `invalid_at_protocol` | decoded and validated, refused on a protocol rule — accepted |
| `tx_nonce_too_low`, `insufficient_funds` | decoded and validated against chain state — accepted |
