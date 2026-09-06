# getBalance

Returns the AE balance for an address.

## Import

```typescript
import { getBalance } from '@growae/reactive/actions'
```

## Usage

```typescript
import { getBalance } from '@growae/reactive/actions'

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

### format

- **Type:** `'ae' | 'aettos'`
- **Default:** `'aettos'`

Unit the balance is returned in.

## Error Types

```typescript
import type { GetBalanceErrorType } from '@growae/reactive'
```

`GetBalanceErrorType` is `BaseErrorType | ErrorType` — a plain `Error` at the
type level. What the action raises:

- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`
- The `@aeternity/aepp-sdk` node error, unwrapped, for any node failure other than a 404

A 404 is not a failure here. An address the node has never seen has no account
entry, and `getBalance` answers `'0'` rather than throwing.
