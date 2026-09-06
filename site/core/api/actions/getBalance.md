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
type GetBalanceReturnType = string
```

The balance as a decimal string, in the unit `format` asked for — aettos by
default (smallest unit, 1 AE = 10^18 aettos), AE when `format: 'ae'`, where the
fractional part is written out and trailing zeros are trimmed (`'1.5'`, `'2'`).

It is a single string, not an object and not a `bigint`. There is no `aettos`
or `ae` field to destructure; call the action twice, or convert the aettos form
yourself with `BigInt(balance)`. An address the node has never seen answers
`'0'`.

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
