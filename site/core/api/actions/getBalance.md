# getBalance

Returns the AE balance for an address.

## Import

```typescript
import { getBalance } from '@reactive/core/actions'
```

## Usage

```typescript
import { getBalance } from '@reactive/core/actions'

const balance = await getBalance(config, {
  address: 'ak_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
})
```

## Return Type

```typescript
type GetBalanceReturnType = {
  aettos: bigint
  ae: string
}
```

### aettos

- **Type:** `bigint`

Balance in aettos (smallest unit, 1 AE = 10^18 aettos).

### ae

- **Type:** `string`

Balance formatted in AE as a decimal string.

## Parameters

### address

- **Type:** `string`
- **Required**

The account address (`ak_...`) to query.

### networkId

- **Type:** `string`
- **Optional**

Target network. Defaults to the currently active network.

## Error Types

```typescript
import type { GetBalanceErrorType } from '@reactive/core'
```

- `NetworkNotConfiguredError` — target network is not in the config
- `NodeRequestError` — the node returned an error
