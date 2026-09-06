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
  method: 'transfer',
  args: ['ak_recipient...', 1000n],
})
```

## Return Type

```typescript
type CallContractReturnType = {
  decodedResult: any
  hash: string
  rawTx: string
  result?: any
  gasUsed?: number
}
```

### decodedResult

- **Type:** `any`

The call's own return value, decoded from the contract's ABI. This is the field
carrying what the Sophia function returned — `result` is not it.

It is `any`, not a type read off the ACI: nothing on this action is generic, so
the decoded value arrives untyped and narrowing it is the caller's job.

### hash

- **Type:** `string`

The transaction hash (`th_...`).

### rawTx

- **Type:** `string`

The signed transaction (`tx_...`).

### result

- **Type:** `any`
- **Optional**

The node's contract call object for the call, as `@aeternity/aepp-sdk` returned
it — gas used, return type, log. Optional because the dry-run path
(`options.callStatic`, and so every `readContract`) does not always produce one;
read `decodedResult` for the return value and treat this as diagnostics.

### gasUsed

- **Type:** `number`
- **Optional**

Gas the node actually charged, lifted out of `result`. `undefined` whenever
`result` is.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `address` | `string` | — | Required. Contract address (`ct_...`). |
| `aci` | `Aci` | — | Required. Contract ACI (Application Call Interface). |
| `method` | `string` | — | Required. Function name to call. |
| `args` | `unknown[]` | `[]` | Arguments to pass to the function. |
| `networkId` | `string` | active | Target network. |
| `options.amount` | `bigint` | `0n` | AE (in aettos) to attach to the call (payable functions). |
| `options.gasLimit` | `number` | auto | Gas limit. Auto-estimated if omitted. |
| `options.gasPrice` | `bigint` | auto | Gas price in aettos. |
| `options.fee` | `bigint` | auto | Transaction fee in aettos. |
| `options.ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |
| `options.callStatic` | `boolean` | `false` | Run the call as a dry-run instead of posting it. `readContract` is this action with `callStatic` forced on. |

Everything below `networkId` lives under `options`. There is no top-level
`amount`, `gas`, `ttl` or `fee` on `CallContractParameters`, and the action
exposes no nonce override at all — the nonce is the SDK's to pick.

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `options: { ttl: 0 }` for no expiration.
:::

## Examples

### Payable contract call

```typescript
const result = await callContract(config, {
  address: 'ct_auction...',
  aci: auctionAci,
  method: 'bid',
  args: [itemId],
  options: { amount: 5000000000000000000n }, // 5 AE
})
```

### Custom TTL

```typescript
const result = await callContract(config, {
  address: 'ct_token...',
  aci: tokenAci,
  method: 'transfer',
  args: ['ak_recipient...', 1000n],
  options: { ttl: 0 }, // no expiration
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
