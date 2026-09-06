# sendTransaction

Sends an arbitrary signed transaction to the network. This is the low-level primitive — most users should prefer higher-level actions like `spend`, `callContract`, etc.

## Import

```typescript
import { sendTransaction } from '@growae/reactive/actions'
```

## Usage

```typescript
import { sendTransaction } from '@growae/reactive/actions'

const result = await sendTransaction(config, {
  tx: signedTx,
})
```

## Return Type

```typescript
type SendTransactionReturnType = {
  hash: string
  rawTx: string
}
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tx` | `string` | — | Required. The signed transaction (`tx_...`) to broadcast. |
| `networkId` | `string` | active | Target network. |
| `connector` | `Connector` | — | Declared on the type; the current implementation does not read it. |
| `waitMined` | `boolean` | — | Declared on the type; the current implementation does not read it. |
| `options.verify` | `boolean` | — | Declared on the type; the current implementation does not read it. |
| `options.waitMined` | `boolean` | — | Declared on the type; the current implementation does not read it. |

`sendTransaction` carries no TTL parameter. A transaction's TTL is fixed when it
is built and signed, which happens before this action is reached — set it on
whichever action built the transaction, or on `buildTransaction`.

::: warning `waitMined` does not wait
`sendTransaction` returns as soon as the node accepts the transaction. It
resolves to a hash, not to an included transaction, whatever `waitMined` or
`options.waitMined` is set to. To wait, call `waitForTransactionConfirm` with
the returned hash.
:::

## Examples

### Wait for the transaction to be confirmed

```typescript
import {
  sendTransaction,
  waitForTransactionConfirm,
} from '@growae/reactive/actions'

const result = await sendTransaction(config, { tx: signedTx })

await waitForTransactionConfirm(config, {
  hash: result.hash,
  confirm: 3,
})
```

## Error Types

```typescript
import type { SendTransactionErrorType } from '@growae/reactive'
```

`SendTransactionErrorType` is `BaseErrorType | ErrorType` — a plain `Error` at
the type level. What the action raises:

- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`
- The `@aeternity/aepp-sdk` node error, unwrapped, when `postTransaction` rejects. A transaction the node refuses — bad signature, wrong nonce, expired TTL, insufficient balance — arrives this way, carrying the node's own reason

`sendTransaction` posts an already-signed transaction. It never reaches the
connector, so it raises nothing about a missing or unsupported wallet.
