# On-node exercise — recorded run

A record of one run, not a gate. Re-run it with `node-exercise.mjs`; the numbers
below are what a later run is compared against.

| | |
|---|---|
| Node | `https://testnet.aeternity.io/v3`, `7.3.0-rc8`, network `ae_uat` |
| Height | 1283399 |
| Recorded | 2026-08-20, UTC |
| References | `@aeternity/aepp-sdk` 14.1.1, `@aeternity/aepp-calldata` 1.9.1 |
| Corpus | 40 vectors over 26 tags |

Nothing was spent. The signer was generated in-process, never persisted, and has
never held a balance on any network; every posted transaction was rejected before
it could reach the mempool. No key material in this repository was read or used.

## The controls, first

The acceptance column below is only evidence if the node rejects a broken
transaction differently from a well-formed one. It does:

| Control | `error_code` |
|---|---|
| truncated rlp | `broken_tx` |
| unknown transaction tag | `broken_tx` |
| one flipped byte inside the wrapped transaction | `broken_tx` |
| broken envelope checksum | `invalid_encoding` |

A single flipped byte turns `signature_check_failed` into `broken_tx`. That is
the whole basis for reading `signature_check_failed` as "the decoder took our
bytes".

## Decoder acceptance — 37 of 40 vectors, 23 of 26 tags

Every vector rebuilt through `ae-core`, wrapped and signed, posted. Three were
refused by the decoder, and **none of the three is a defect in this core**: each
was reproduced byte-for-byte with `@aeternity/aepp-sdk` 14.1.1 building *and*
wrapping the transaction, independently of anything written here.

What they are instead is the failure mode the on-node half exists to catch — a
committed vector both implementations agree on that the chain will not take. An
offline byte-diff scores all three green.

### 1. `NameUpdateTx` version 2 — the version is not free

Five probes, all built by the reference sdk:

| Serialised version | Pointers | Node |
|---|---|---|
| 1 | `account_pubkey` → `ak_` | accepted |
| 1 | `contract_pubkey` → `ct_` | accepted |
| 1 | none | accepted |
| 1 | `raw` → `ba_` | **`broken_tx`** |
| 2 | `account_pubkey` → `ak_` | **`broken_tx`** |
| 2 | `contract_pubkey` → `ct_` | **`broken_tx`** |
| 2 | none | **`broken_tx`** |
| 2 | `raw` → `ba_` | accepted |

The node accepts version 2 **only** when a pointer needs it, and version 1 only
when none does — one encoding per content, enforced at decode. The reference sdk
takes `version: 2` from the caller and serialises it either way, so a caller can
build a transaction the chain refuses and nothing offline notices.

The node's own builder agrees with the node: asked for the corpus's v2 id-pointer
parameters it returns a **version 1** transaction. Two of the three implementations
agree, and the odd one out is the reference sdk.

The committed vector `name update v2, id pointer` is therefore a valid *encoding*
test and an invalid *transaction*.

### 2. `ChannelCreateTx` — delegates must be accounts

| Delegates | Node |
|---|---|
| none | accepted |
| `ak_`, `ak_` | accepted |
| `ak_` and `ct_`, `ok_` | **`broken_tx`** |
| `ok_` only | **`broken_tx`** |

The committed vector `channel create, with delegates` uses a contract and an
oracle as responder delegates. Same shape of finding as above: the bytes are
agreed, the transaction is not acceptable.

### 3. `ChannelForceProgressTx` — refused whatever it contains

Seven variants were posted, crossing signed against unsigned payloads, a real
`ChannelOffChainUpdateTransfer` entry against an arbitrary `cb_` blob as the
update, and a well-formed empty `StateTrees` entry against the corpus's
two-byte one. **Every one was `broken_tx`.**

The cause is therefore none of those three fields. What is measured is that this
tag has no on-node evidence available by this route; diagnosing why is the node's
business, not this harness's. It is the one tag in the corpus with no acceptance
result, and it is reachable today through `buildTransaction()`.

## Node-builder byte agreement — 18 identical, 0 disagreements

The node exposes its own Erlang transaction builders behind `/v3/debug/…`. Same
parameters in, bytes compared. This is a third implementation, not a second
opinion from the same family.

| Verdict | Vectors |
|---|---|
| identical | 18 |
| node declined to build (needs chain state, or rejects a corpus value) | 12 |
| no builder on the node's HTTP surface | 6 |
| not comparable (different transaction version) | 2 |
| differs | 2 |

**Eighteen byte-for-byte agreements across `SpendTx`, four name tags, three
oracle tags, `ContractCreateTx` and five channel tags.** No vector where all
three implementations built the same transaction produced three different
answers.

The two `differs` rows are both `NameUpdateTx`, and neither is an encoding
disagreement in this core:

- `name update v1, explicit ttls and several pointers` — the node's HTTP builder
  emits the pointer list **reversed**. Ours is in the order given, byte-identical
  to the reference sdk, and the node's own decoder accepts it. A quirk of that
  endpoint, not a wire rule.
- `name update v2, id pointer` — the node builds at version 1, per the rule above.

The twelve declines are all state lookups or value rejections, not serialisation:
`Contract code … not found`, `Oracle address … not found`, `Invalid hash: name`
(the endpoint wants a name hash where the transaction carries the name),
`Invalid hash: payload`, `Invalid pointers`.

`ChannelCreateTx` is *not comparable* rather than failing: the node's HTTP
builder takes one `delegate_ids` list, while the tag serialises at version 2 with
separate initiator and responder lists. Comparing them would compare two
different transactions.

## Per tag

| Tag | Built by the node | Posted |
|---|---|---|
| `SpendTx` | identical ×4 | accepted ×4 |
| `SignedTx` | no builder ×2 | accepted ×2 |
| `NamePreclaimTx` | identical | accepted |
| `NameClaimTx` | declined ×2 | accepted ×2 |
| `NameUpdateTx` | identical ×2, differs ×2, declined | accepted ×4, **rejected ×1** |
| `NameTransferTx` | identical | accepted |
| `NameRevokeTx` | identical | accepted |
| `ContractCreateTx` | identical ×2 | accepted ×2 |
| `ContractCallTx` | declined ×2 | accepted ×2 |
| `OracleRegisterTx` | identical ×2 | accepted ×2 |
| `OracleQueryTx` | declined ×2 | accepted ×2 |
| `OracleRespondTx` | declined | accepted |
| `OracleExtendTx` | identical | accepted |
| `ChannelCreateTx` | not comparable ×2 | accepted, **rejected ×1** |
| `ChannelDepositTx` | identical | accepted |
| `ChannelWithdrawTx` | identical | accepted |
| `ChannelCloseMutualTx` | identical | accepted |
| `ChannelCloseSoloTx` | declined | accepted (`invalid_at_protocol`) |
| `ChannelSlashTx` | declined | accepted (`invalid_at_protocol`) |
| `ChannelSettleTx` | identical | accepted |
| `ChannelSnapshotSoloTx` | declined | accepted (`invalid_at_protocol`) |
| `ChannelOffChainTx` | no builder | accepted |
| `ChannelForceProgressTx` | no builder | **rejected** |
| `GaAttachTx` | no builder | accepted |
| `GaMetaTx` | no builder | accepted |
| `PayingForTx` | declined | accepted |

`invalid_at_protocol` is an accepting outcome: the node decoded the transaction
and refused it on a protocol rule, which is a step past the decoder.
