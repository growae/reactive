# On-node exercise — recorded run

A record of one run, not a gate. Re-run it with `node-exercise.mjs`; the numbers
below are what a later run is compared against.

| | |
|---|---|
| Node | `https://testnet.aeternity.io/v3`, `7.3.0-rc8`, network `ae_uat` |
| Height | 1283426 |
| Recorded | 2026-08-20, UTC |
| References | `@aeternity/aepp-sdk` 14.1.1, `@aeternity/aepp-calldata` 1.9.1 |
| Corpus | 41 vectors over 26 tags — 38 postable, 3 not |

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

## Decoder acceptance — 38 of 38 postable vectors, every tag but one

Every vector rebuilt through `ae-core`, wrapped and signed, posted. Every one of
the 38 postable vectors was accepted by the decoder. Three vectors are marked
non-postable and are excluded from that count, and **none of the three is a
defect in this core**: each was reproduced byte-for-byte with
`@aeternity/aepp-sdk` 14.1.1 building *and* wrapping the transaction,
independently of anything written here.

The exclusion is re-earned on every run rather than assumed. `node-exercise.mjs`
posts the non-postable vectors too and fails if the node now takes one, because
an exclusion nobody has re-checked is a vector quietly removed from the
measurement. Verified against a deliberately false marking: marking `spend,
minimal` non-postable makes the run exit non-zero with
`STALE MARKING — a vector marked non-postable was accepted by the node`.

What they are instead is the failure mode the on-node half exists to catch — a
committed vector both implementations agree on that the chain will not take. An
offline byte-diff scores all three green.

All three stay in the corpus. They are correct encoding tests and invalid
transactions, and that is the finding — deleting them deletes the evidence. Each
is marked non-postable, names the chain rule that refuses it, and is excluded
from the on-node clause of parity green; where a chain-acceptable sibling exists
for the tag it is added alongside, so the tag still has an acceptance result. See
`README.md` for the clause this scopes.

### 1. `NameUpdateTx` version 2 — the version is not free

Eight probes, all built by the reference sdk:

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
test and an invalid *transaction*. Its postable sibling is
`name update v2, raw pointer`, which was already in the corpus — a version 2
name update the node does accept, because its pointer needs version 2.

### 2. `ChannelCreateTx` — delegates must be accounts

| Delegates | Node |
|---|---|
| none | accepted |
| `ak_`, `ak_` | accepted |
| `ak_` and `ct_`, `ok_` | **`broken_tx`** |
| `ok_` only | **`broken_tx`** |

The committed vector `channel create, with delegates` uses a contract and an
oracle as responder delegates. Same shape of finding as above: the bytes are
agreed, the transaction is not acceptable. Its postable sibling
`channel create, with account delegates` was added for it and the node accepts
it — this was the only sibling the corpus was actually missing.

### 3. `ChannelForceProgressTx` — refused whatever it contains

Seven variants were posted, crossing signed against unsigned payloads, a real
`ChannelOffChainUpdateTransfer` entry against an arbitrary `cb_` blob as the
update, and a well-formed empty `StateTrees` entry against the corpus's
two-byte one. **Every one was `broken_tx`.**

The cause is therefore none of those three fields. What is measured is that this
tag has no on-node evidence available by this route; diagnosing why is the node's
business, not this harness's. It is the one tag in the corpus with no acceptance
result, and it is reachable today through `buildTransaction()`.

It is therefore a **named exception**, not a pass. `gate.rs` pins it in both
directions: removing the exception without giving the tag a postable vector
fails, and giving it one without removing the exception fails too. Turning it
into a silent pass takes deleting a line.

## Node-builder byte agreement — 18 identical, 0 disagreements, 1 not comparable

The node exposes its own Erlang transaction builders behind `/v3/debug/…`. Same
parameters in, bytes compared. This is a third implementation, not a second
opinion from the same family.

| Verdict | Vectors |
|---|---|
| identical | 18 |
| node declined to build (needs chain state, rejects a value, or errors) | 14 |
| no builder on the node's HTTP surface | 6 |
| excluded, non-postable | 2 |
| not comparable — the endpoint returned a different transaction | 1 |
| **differs** — same transaction, different bytes | **0** |

**Eighteen byte-for-byte agreements across `SpendTx`, four name tags, three
oracle tags, `ContractCreateTx` and five channel tags.** No vector where all
three implementations built the same transaction produced three different
answers.

A non-postable vector leaves this half too, for the reason it left the
acceptance half: the node has already said it will not take that transaction, so
asking whether it builds the same bytes scores a disagreement already recorded as
the refusal. That removes `name update v2, id pointer`, where the node builds at
version 1 per the rule above.

**Nothing here is excluded by anyone's judgement.** Every row that is not
byte-identical is classified by decoding both sides through `ae-core` and
comparing them field by field. A row leaves the comparison only when the decoded
content differs, and it has to name the field that says so — one row does:

- `name update v1, explicit ttls and several pointers` — field `pointers`, sent
  `account, oracle, contract`, returned `contract, oracle, account`. The node's
  own decoder accepts our bytes.

`differs` therefore keeps meaning same transaction, different bytes, and there
are **none**. It is an unconditional failure with no prose attached: making the
classifier blind to `pointers` turns that row into `differs` and the run exits
non-zero with `CLAUSE 6 FAILED — the node built the same transaction with
different bytes`. Measured, then reverted.

The reversal was re-measured by this run rather than taken from the ruling that
named it, because "reversed" and "canonicalised" are different findings and only
one of them disqualifies the endpoint:

| Pointer order sent | Order the endpoint emits |
|---|---|
| `account`, `oracle`, `contract` | `contract`, `oracle`, `account` |
| `contract`, `oracle`, `account` | `account`, `oracle`, `contract` |
| `oracle`, `account`, `contract` | `contract`, `account`, `oracle` |

It is an involution, not a canonicalisation — a canonicalisation is idempotent,
and this one round-trips. The endpoint therefore does not preserve pointer order
in either direction and cannot serve as a reference for that field whichever
order is correct. What it returns is not the transaction it was asked for, and it
is the only row in the corpus for which that is true — the `ChannelCreateTx`
precedent this originally cited did not survive being measured, as the section
below records.

The probe runs on every exercise, so the exclusion is re-earned rather than
remembered. If the endpoint is ever fixed it stops holding and the run exits
non-zero with `PROBE CHANGED — the name-update endpoint now preserves pointer
order`, forcing the row back into the comparison instead of leaving it quietly
excluded — verified by inverting the probe's predicate, and reverted. Clause 6
also refuses to score satisfied while the probe reports a preserved order.

Twelve of the fourteen declines are state lookups or value rejections, not
serialisation:
`Contract code … not found`, `Oracle address … not found`, `Invalid hash: name`
(the endpoint wants a name hash where the transaction carries the name),
`Invalid hash: payload`, `Invalid pointers`.

### `ChannelCreateTx` — the endpoint is broken, which is not what was claimed

The other two declines are this tag, and they are a correction to my own earlier
report. The row used to be excluded by a mapper that refused to send at all, on
the stated ground that the endpoint's single `delegate_ids` list and the tag's
two lists are different transactions. Sending it and letting the mechanism decide
measured something else: **`/v3/debug/channels/create` answers HTTP 500 to every
well-formed body** — with delegates, with an empty list, and with the key absent.
It validates first, since a missing `state_hash` still comes back as a 400 naming
the field, so the 500 is the builder rather than the request.

Whether the two delegate lists would have compared was therefore never
established, and the old comment asserted a conclusion its evidence did not
reach. Both rows are now `node-declined`, which is what was observed.

## Per tag

| Tag | Built by the node | Posted |
|---|---|---|
| `SpendTx` | identical ×4 | accepted ×4 |
| `SignedTx` | no builder ×2 | accepted ×2 |
| `NamePreclaimTx` | identical | accepted |
| `NameClaimTx` | declined ×2 | accepted ×2 |
| `NameUpdateTx` | identical ×2, not comparable ×1, declined, excluded ×1 | accepted ×4, **non-postable ×1** |
| `NameTransferTx` | identical | accepted |
| `NameRevokeTx` | identical | accepted |
| `ContractCreateTx` | identical ×2 | accepted ×2 |
| `ContractCallTx` | declined ×2 | accepted ×2 |
| `OracleRegisterTx` | identical ×2 | accepted ×2 |
| `OracleQueryTx` | declined ×2 | accepted ×2 |
| `OracleRespondTx` | declined | accepted |
| `OracleExtendTx` | identical | accepted |
| `ChannelCreateTx` | declined ×2 (HTTP 500), excluded ×1 | accepted ×2, **non-postable ×1** |
| `ChannelDepositTx` | identical | accepted |
| `ChannelWithdrawTx` | identical | accepted |
| `ChannelCloseMutualTx` | identical | accepted |
| `ChannelCloseSoloTx` | declined | accepted (`invalid_at_protocol`) |
| `ChannelSlashTx` | declined | accepted (`invalid_at_protocol`) |
| `ChannelSettleTx` | identical | accepted |
| `ChannelSnapshotSoloTx` | declined | accepted (`invalid_at_protocol`) |
| `ChannelOffChainTx` | no builder | accepted |
| `ChannelForceProgressTx` | no builder | **non-postable, named exception** |
| `GaAttachTx` | no builder | accepted |
| `GaMetaTx` | no builder | accepted |
| `PayingForTx` | declined | accepted |

`invalid_at_protocol` is an accepting outcome: the node decoded the transaction
and refused it on a protocol rule, which is a step past the decoder.
