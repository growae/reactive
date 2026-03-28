# transferFunds

Transfers a fraction of the account balance to a recipient.

## Import

```typescript
import { transferFunds } from '@growae/reactive/actions'
```

## Usage

```typescript
import { transferFunds } from '@growae/reactive/actions'

const result = await transferFunds(config, {
  fraction: 0.5,
  recipient: 'ak_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
})
```

## Return Type

```typescript
type TransferFundsReturnType = {
  hash: string
  rawTx: string
}
```

### hash

- **Type:** `string`

The transaction hash.

### rawTx

- **Type:** `string`

The signed transaction.

## Parameters

### fraction

- **Type:** `number`
- **Required**

Fraction of the balance to transfer, between 0 and 1 (e.g. `0.5` for 50%).

### recipient

- **Type:** `string`
- **Required**

Recipient address (`ak_...`).

### ttl

- **Type:** `number`
- **Default:** `300`

Transaction TTL in blocks relative to current height. Set to `0` for no expiration.

### waitMined

- **Type:** `boolean`
- **Default:** `true`

Whether to wait for the transaction to be mined before returning.

## Error Types

```typescript
import type { TransferFundsErrorType } from '@growae/reactive'
```

- `ConnectorNotConnectedError` — no wallet connected
- `InsufficientBalanceError` — not enough AE
- `NodeRequestError` — the node returned an error
