# buildTransaction

Builds an unsigned transaction.

## Import

```typescript
import { buildTransaction } from '@growae/reactive/actions'
```

## Usage

```typescript
import { buildTransaction } from '@growae/reactive/actions'
import { Tag } from '@aeternity/aepp-sdk'

const unsignedTx = await buildTransaction(config, {
  tag: Tag.SpendTx,
  senderId: 'ak_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
  recipientId: 'ak_recipient...',
  amount: 1000000000000000000n,
})
```

## Return Type

```typescript
type BuildTransactionReturnType = string
```

The unsigned transaction as an RLP-encoded string.

## Parameters

### tag

- **Type:** `Tag`
- **Required**

Transaction type tag (e.g. `Tag.SpendTx`, `Tag.ContractCallTx`).

### networkId

- **Type:** `string`
- **Optional**

Target network. Defaults to the currently active network.

Additional fields are required depending on the transaction type specified by `tag`.

## Error Types

```typescript
import type { BuildTransactionErrorType } from '@growae/reactive'
```

- `NetworkNotConfiguredError` — target network is not in the config
- `NodeRequestError` — the node returned an error
