# Map key ordering — recorded run

A record of one run, not a gate, in the shape `crates/ae-parity/TESTNET.md`
uses. Re-run it with the two files beside this one; the results below are what a
later run is compared against.

| | |
|---|---|
| Devnet | `docker-compose.yml`, `aeternity/aeternity:v7.2.0`, network `ae_devnet`, protocol 6 |
| Public node | `https://testnet.aeternity.io/v3`, `7.3.0-rc8`, network `ae_uat`, height 1283431 |
| Recorded | 2026-08-20, UTC |
| References | `@aeternity/aepp-sdk` 14.1.1, `@aeternity/aepp-calldata` 1.9.1, `aesophia_http` 8.0.0 |
| Path exercised | `callContract` → `Contract.$call` → `AciContractCallEncoder`, `packages/core/src/actions/callContract.ts:63` |

```
docker compose up -d
INTEGRATION=1 pnpm vitest run test/integration/mapKeyOrder.integration.test.ts
node test/integration/mapOrderDryRun.mjs
```

Nothing was spent. The devnet is a throwaway chain this repository starts, and
the recorded run funded it from an account generated for that run — genesis
file written in the run, `AE_DEVNET_FUNDER_SK` pointed at it, the committed
genesis account untouched. The `ae_uat` half posts nothing: `/v3/dry-run`
executes real FATE against real chain state and commits none of it, and its
caller was generated in-process and given a balance only inside the dry run. No
key material in this repository was read or used.

## What was measured

`@aeternity/aepp-calldata` sorts the entries of a `map` argument before
serialising it, and its order is not the node's:

- **`map(string, _)`** — it compares `String.length`, UTF-16 code units. The
  node's `aeb_fate_data:lt/2` compares `byte_size/1`, UTF-8 bytes. The two
  disagree only when a key is non-ASCII, which is exactly where the two lengths
  stop coinciding: `"ä"` is one code unit and two bytes.
- **`map(bits, _)`** — the node sorts negative `bits` values after non-negative
  ones and two negatives numerically. The encoder does not.

`aeb_fate_encoding:deserialize2/1` re-sorts the pairs it reads and refuses the
value when the incoming order is not its own, so the disagreement is not
cosmetic.

## The controls, first

An acceptance result is only evidence if something comparable is rejected. Each
trigger below is posted beside an argument of the same type that cannot trigger
the defect, and the last row is the same call twice at the byte level, differing
only in which `(key, value)` pair comes first.

## Devnet — transactions actually included, `ae_devnet`

Every row is one real `ContractCallTx`, mined, its call object read back off the
chain.

| Call | `return_type` | `gas_used` | Decoded |
|---|---|---|---|
| `bulk({"ab"→1, "xy"→2})` — control | `ok` | 71 | `2` |
| `bulk({"ä"→1, "xy"→2})` | **`error`** | 200000 | — |
| `bulk({"xy"→2, "ä"→1})` — same entries, other insertion order | **`error`** | 200000 | — |
| `bulk_bits({0→1, 1→2})` — control | `ok` | 71 | `2` |
| `bulk_bits({-1→1, -2→2})` | **`error`** | 200000 | — |
| `emit_string_map()` — decode side | `ok` | 29 | `Map("xy" → 2, "ä" → 1)` |
| `emit_bits_map()` — decode side | `ok` | 27 | `Map(-2 → 2, -1 → 1)` |
| `bulk(emit_string_map())` — round trip | **`error`** | 200000 | — |

Insertion order changes nothing, which is the part that matters for a caller:
the encoder sorts, so there is no argument a caller can pass that avoids it.
`gas_used` equals the whole gas limit on every failure — the call does not run,
it dies in the decoder, and the caller pays the full limit for it.

## `ae_uat` — the same calls through `/v3/dry-run`

The public node names the failure, where the devnet returned an empty error
value:

| Call | `return_type` | `gas_used` | Reason / return value |
|---|---|---|---|
| `ContractCreateTx` | `ok` | 61 | — |
| `bulk({"ab"→1, "xy"→2})` — control | `ok` | 71 | `0x04` |
| `bulk({"ä"→1, "xy"→2})` | **`error`** | 200000 | **`bad_call_data`** |
| `bulk_bits({0→1, 1→2})` — control | `ok` | 71 | `0x04` |
| `bulk_bits({-1→1, -2→2})` | **`error`** | 200000 | **`bad_call_data`** |
| `emit_string_map()` | `ok` | 29 | `0x2f020978790409c3a402` |
| `emit_bits_map()` | `ok` | 27 | `0x2f02cf0204cf0102` |
| the trigger's bytes, pairs swapped | `ok` | 71 | `0x04` |

## The byte-order control — the cause, not just the symptom

A rejection alone would leave open that the node refuses the non-ASCII key for
its content. So the same call is posted twice, byte-identical but for the order
of the two pairs:

```
2b11d72a9801 1b   the `bulk` call frame
2f02              a map of two entries
09c3a4 02         "ä" → 1
097879 04         "xy" → 2
```

| Calldata | Node |
|---|---|
| `2b11d72a98011b2f0209c3a40209787904` — `"ä"` first, what the encoder produces | **`error`**, 200000 gas |
| `2b11d72a98011b2f020978790409c3a402` — `"xy"` first | `ok`, 71 gas |

The same two entries, the same contract, the same caller. Only the pair order
differs, and it decides whether the call runs.

## The decode side is not affected

The node cannot emit an unsorted map, so nothing coming back is refused —
`emit_string_map()` and `emit_bits_map()` both decode, and both come back in
the node's order, `"xy"` before `"ä"` and `-2` before `-1`. Those two rows are
therefore also the measurement of the correct order: it is the node's own
answer, not a reading of its source.

**The round trip is affected, and it is the shape an application actually
writes.** Read a map off the chain, hand it back to a call, and re-encoding
sorts it into the encoder's order again — `bulk(emit_string_map())` fails
exactly as the literal does. A value having come from the chain buys nothing.

## Deployment — the same encoder, a different failure

Recorded 2026-09-02 UTC, on the same devnet image (`aeternity/aeternity:v7.2.0`,
`ae_devnet`), against `aesophia_http` 8.0.0 and the same sdk and calldata
versions. Contract `MapOrderInit.aes`; path exercised `deployContract` →
`Contract.$deploy` → `AciContractCallEncoder`, whose call data is
`encode(contract, "init", args)`.

```
docker compose up -d
INTEGRATION=1 pnpm vitest run test/integration/mapKeyOrderDeploy.integration.test.ts
```

`init` takes two arguments so both sides of the guard's deliberate asymmetry can
be posted from one contract: `entries : map(string, int)`, which the guard reads
off the ACI and refuses, and `wrapped : wrapper`, the same map behind a
`datatype` the guard stops descending into and therefore lets through.

| Deployment | Node | `gas_used` | Nonce |
|---|---|---|---|
| `init({"ä"→1, "ö"→2}, Wrapped({"ä"→1, "ö"→2}))` — control | `ok`, contract created, `size()` returns `4` | 94 | advances |
| `init({"ä"→1, "xy"→2}, …)` — the guard sees it | refused in `packages/core`, nothing built | 0 | unmoved |
| `init(control, Wrapped({"ä"→1, "xy"→2}))` — the guard misses it | accepted into the mempool, **never included** | 0 | unmoved |

**The third row is the finding.** A `ContractCallTx` carrying a disagreeing map
is mined, comes back `error`, and is charged the whole gas limit — every failure
row in the tables above. A `ContractCreateTx` carrying one is not. The node logs
`Tx pool events hashes: [th_…]` for it and then nothing: every micro block after
it carries zero transactions, no error is logged, `/v3/transactions/th_…`
answers `404`, and the caller's next nonce is unchanged and reusable — the very
next deployment took that same nonce and was mined normally.

What the caller sees is the sdk giving up polling:
`RestError: v3/transactions/th_… error: Transaction not found`, naming a hash
the node denies having. So on the deployment path this defect costs no gas; it
costs a transaction that disappears, and the guard buys legibility rather than
money. The row that opened this work assumed the opposite, on the reasonable
inference that a shared encoder implies a shared failure — it does not.

**The wrap around `NodeInvocationError` is for a different failure and does
fire.** An `init` that aborts is included and refused normally: a contract whose
`init` calls `require(false, "init said no")` returned `return_type=revert`,
`gas_used=31`, and `DeployContractInvocationError` carried
`reason: "init said no"` and the transaction hash — which the sdk drops on this
path, so the hash exists only because the signing is observed on the way past.
