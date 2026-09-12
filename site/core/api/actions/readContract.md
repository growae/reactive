# readContract

Calls a Sophia contract function as a dry-run (no transaction, no fees). Used for reading contract state.

## Import

```typescript
import { readContract } from '@growae/reactive/actions'
```

## Usage

```typescript
import { readContract } from '@growae/reactive/actions'

const result = await readContract(config, {
  address: 'ct_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
  aci: contractAci,
  method: 'get_balance',
  args: ['ak_2dA...'],
})
```

## Return Type

```typescript
type ReadContractReturnType = CallContractReturnType
```

The same flat object `callContract` returns — `decodedResult`, `hash`, `rawTx`,
and the optional `result` and `gasUsed`. Field by field, see
[`callContract`](/core/api/actions/callContract#return-type).

The read's own value is on `decodedResult`, and it is `any`. **Nothing here is
generic.** Neither `readContract` nor `callContract` takes a type parameter and
neither reads a return type off the ACI, so the decoded value is not inferred
and not narrowed — a caller that wants a type asserts it:

```typescript
const { decodedResult } = await readContract(config, {
  address: 'ct_token...',
  aci: tokenAci,
  method: 'balance',
  args: ['ak_owner...'],
})
const balance = decodedResult as bigint
```

Because the call is a dry-run, `hash` and `rawTx` describe the transaction the
node executed and discarded; nothing was posted.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `address` | `string` | — | Required. Contract address (`ct_...`). |
| `aci` | `Aci` | — | Required. Contract ACI (Application Call Interface). |
| `method` | `string` | — | Required. Function name to call. |
| `args` | `unknown[]` | `[]` | Arguments to pass to the function. |
| `networkId` | `string` | active | Target network. |
| `options.amount` | `bigint` | `0n` | AE (in aettos) to attach to the dry-run. |
| `options.gasLimit` | `number` | auto | Gas limit. |
| `options.gasPrice` | `bigint` | auto | Gas price in aettos. |
| `options.fee` | `bigint` | auto | Transaction fee in aettos. |
| `options.ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. |

`ReadContractParameters` is `CallContractParameters` with `options.callStatic`
removed — this action forces it on, which is what makes the call a dry-run.

## Examples

### Read token balance

```typescript
const { decodedResult: balance } = await readContract(config, {
  address: 'ct_token...',
  aci: tokenAci,
  method: 'balance',
  args: ['ak_owner...'],
})
```

The balance is on `decodedResult`. The action's own return value is the whole
`CallContractReturnType` object, so `const balance = await readContract(…)`
binds that object, not the number.

## Error Types

`readContract` is `callContract` with `callStatic: true` and raises that
action's errors. The package exports no `ReadContractErrorType`; the union to
import is `callContract`'s:

```typescript
import type { CallContractErrorType } from '@growae/reactive'
```

- `CallContractMapKeyOrderError` — a `map` argument would be serialised in a key order the node's decoder refuses. Checked before the node is reached
- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`
- `CallContractInvocationError` — the node executed the dry-run and refused it; carries `reason`, `transaction` and `transactionHash`

Any other `@aeternity/aepp-sdk` failure is rethrown unchanged — no contract
deployed at `address` arrives that way, as the node's own error.

`CallContractNoAccountError` is not reachable from `readContract`: the account
check is skipped on the static path, which is what makes a read work while
disconnected. `SimulateContractMapKeyOrderError` belongs to `simulateContract`,
not to this action.
