# waitForTransactionConfirm

Waits for a transaction to reach a confirmation depth.

## Import

```typescript
import { waitForTransactionConfirm } from '@growae/reactive/actions'
```

## Usage

```typescript
import { waitForTransactionConfirm } from '@growae/reactive/actions'

const confirmedHeight = await waitForTransactionConfirm(config, {
  hash: 'th_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
})
```

## Return Type

```typescript
type WaitForTransactionConfirmReturnType = number
```

The block height at which the transaction reached the required confirmation depth.

## Parameters

### hash

- **Type:** `string`
- **Required**

The transaction hash to wait for.

### confirm

- **Type:** `number`
- **Default:** `3`

Number of key blocks to wait for confirmation.

### interval

- **Type:** `number`
- **Default:** `1000`

Polling interval in milliseconds.

## Error Types

```typescript
import type { WaitForTransactionConfirmErrorType } from '@growae/reactive'
```

- `TransactionNotFoundError` — the transaction hash was not found
- `NodeRequestError` — the node returned an error
