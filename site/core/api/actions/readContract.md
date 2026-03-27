# readContract

Calls a Sophia contract function as a dry-run (no transaction, no fees). Used for reading contract state.

## Import

```typescript
import { readContract } from '@reactive/core/actions'
```

## Usage

```typescript
import { readContract } from '@reactive/core/actions'

const result = await readContract(config, {
  address: 'ct_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
  aci: contractAci,
  fn: 'get_balance',
  args: ['ak_2dA...'],
})
```

## Return Type

The return type depends on the contract function's return type as defined in the ACI. Reactive infers this automatically when TypeScript generics are used.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `address` | `string` | — | Required. Contract address (`ct_...`). |
| `aci` | `Aci` | — | Required. Contract ACI (Application Call Interface). |
| `fn` | `string` | — | Required. Function name to call. |
| `args` | `unknown[]` | `[]` | Arguments to pass to the function. |
| `networkId` | `string` | active | Target network. |

## Examples

### Read token balance

```typescript
const balance = await readContract(config, {
  address: 'ct_token...',
  aci: tokenAci,
  fn: 'balance',
  args: ['ak_owner...'],
})
```

## Error Types

```typescript
import type { ReadContractErrorType } from '@reactive/core'
```

- `ContractNotFoundError` — contract not deployed at address
- `ContractCallError` — the dry-run failed
