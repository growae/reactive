# callContract

Calls a Sophia contract function as an on-chain transaction (stateful call). Used for writing to contract state.

## Import

```typescript
import { callContract } from '@growae/reactive/actions'
```

## Usage

```typescript
import { callContract } from '@growae/reactive/actions'

const result = await callContract(config, {
  address: 'ct_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
  aci: contractAci,
  fn: 'transfer',
  args: ['ak_recipient...', 1000n],
})
```

## Return Type

```typescript
type CallContractReturnType = {
  hash: string
  result: unknown
  rawTx: string
}
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `address` | `string` | — | Required. Contract address (`ct_...`). |
| `aci` | `Aci` | — | Required. Contract ACI (Application Call Interface). |
| `fn` | `string` | — | Required. Function name to call. |
| `args` | `unknown[]` | `[]` | Arguments to pass to the function. |
| `amount` | `bigint` | `0n` | AE (in aettos) to attach to the call (payable functions). |
| `gas` | `number` | auto | Gas limit. Auto-estimated if omitted. |
| `gasPrice` | `bigint` | auto | Gas price in aettos. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |
| `nonce` | `number` | auto | Account nonce. |
| `fee` | `bigint` | auto | Transaction fee in aettos. |

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Examples

### Payable contract call

```typescript
const result = await callContract(config, {
  address: 'ct_auction...',
  aci: auctionAci,
  fn: 'bid',
  args: [itemId],
  amount: 5000000000000000000n, // 5 AE
})
```

### Custom TTL

```typescript
const result = await callContract(config, {
  address: 'ct_token...',
  aci: tokenAci,
  fn: 'transfer',
  args: ['ak_recipient...', 1000n],
  ttl: 0, // no expiration
})
```

## Error Types

```typescript
import type { CallContractErrorType } from '@growae/reactive'
```

`CallContractErrorType` names its concrete classes, so `instanceof` narrows
against it. In the order the action can raise them:

- `CallContractMapKeyOrderError` — a `map` argument would be serialised in a key order the node's decoder refuses. Checked first, before the node is reached and before anything is built, so nothing was posted and no gas was spent
- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`
- `CallContractNoAccountError` — no connected account, on a call that is not `callStatic`
- `CallContractInvocationError` — the node executed the call and refused it; carries `reason`, `transaction` and `transactionHash`

Any other `@aeternity/aepp-sdk` failure — contract initialisation, node
transport — is rethrown unchanged.
