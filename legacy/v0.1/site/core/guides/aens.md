# AENS Names

The Aeternity Name System (AENS) allows you to register human-readable `.chain` names that point to accounts, contracts, oracles, or channels.

## Overview

AENS name registration follows a **commit-reveal scheme** to prevent front-running:

1. **Preclaim** — commit a hash of the desired name (hidden from others)
2. **Claim** — reveal and register the name
3. **Update** — set pointers (account, contract, oracle, etc.)
4. **Transfer** — transfer ownership to another account
5. **Revoke** — give up the name

## Preclaim a Name

```typescript
import { preclaimName } from '@growae/reactive/actions'

const preclaim = await preclaimName(config, {
  name: 'alice.chain',
})
// { txHash, rawTx, blockHeight, salt, commitmentId }
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | — | Required. The name to preclaim (must end in `.chain`). |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |

`commitmentId` is derived from the name and the salt — it is the value that was
posted, not a block hash. Keep `salt`; `claimName` needs it.

Throws `PreclaimNameNoAccountError` when no account is connected.

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Claim a Name

After preclaiming, wait at least 1 key block, then claim:

```typescript
import { claimName } from '@growae/reactive/actions'

const claim = await claimName(config, {
  name: 'alice.chain',
  salt: preclaim.salt,
})
// { txHash, rawTx, blockHeight, nameId }
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | — | Required. The name to claim. |
| `salt` | `number` | `0` | Salt from the preclaim step. Since Ceres a name can be claimed without preclaiming, so it is optional. |
| `nameFee` | `bigint \| string` | auto | Name fee (auction price for short names). |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |

Throws `ClaimNameNoAccountError` when no account is connected.

## Update Name Pointers

```typescript
import { updateName } from '@growae/reactive/actions'

await updateName(config, {
  name: 'alice.chain',
  pointers: [{ key: 'account_pubkey', id: 'ak_2dA...' }],
})
// { txHash, rawTx, blockHeight }
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | — | Required. The name to update. |
| `pointers` | `{ key: string; id: string }[]` | — | Required. The pointers to set. |
| `extendPointers` | `boolean` | `false` | Merge with the pointers already on the name instead of replacing them. |
| `nameTtl` | `number` | `180000` | Name TTL in blocks (~375 days max). |
| `clientTtl` | `number` | `3600` | Client cache TTL in seconds. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |

Throws `UpdateNameNoAccountError` when no account is connected.

## Transfer a Name

```typescript
import { transferName } from '@growae/reactive/actions'

await transferName(config, {
  name: 'alice.chain',
  recipient: 'ak_newOwner...',
})
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | — | Required. The name to transfer. |
| `recipient` | `string` | — | Required. New owner address. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |

## Resolve a Name

```typescript
import { resolveName } from '@growae/reactive/actions'

const address = await resolveName(config, {
  name: 'alice.chain',
  key: 'account_pubkey',
})
// 'ak_2dA...', or null
```

This is a read-only operation (no transaction, no TTL). A name that is not
registered, or one with no pointer under `key`, resolves to `null` rather than
throwing — asking whether a name resolves is an ordinary question, not an
exceptional one.

## Name Auctions

Names shorter than 13 characters go through an auction process. The auction lasts for a duration proportional to name length:

| Name Length | Auction Duration |
|-------------|-----------------|
| 1–4 chars | ~62 days |
| 5–8 chars | ~31 days |
| 9–12 chars | ~1 day |
| 13+ chars | No auction (instant claim) |

Use `bidName` to participate:

```typescript
import { bidName } from '@growae/reactive/actions'

await bidName(config, {
  name: 'ae.chain',
  nameFee: 51000000000000000000n, // must exceed current highest bid
})
```
