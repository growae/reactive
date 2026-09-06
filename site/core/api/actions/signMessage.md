# signMessage

Signs an arbitrary message with the connected account's private key.

## Import

```typescript
import { signMessage } from '@growae/reactive/actions'
```

## Usage

```typescript
import { signMessage } from '@growae/reactive/actions'

const signature = await signMessage(config, {
  message: 'Hello, Aeternity!',
})
```

## Return Type

```typescript
type SignMessageReturnType = {
  signature: string
  address: string
}
```

### signature

- **Type:** `string`

The hex-encoded signature.

### address

- **Type:** `string`

The account address that signed the message.

## Parameters

### message

- **Type:** `string`
- **Required**

The message to sign.

### account

- **Type:** `string`
- **Optional**

Specific account to sign with. Defaults to the currently active account.

## Error Types

```typescript
import type { SignMessageErrorType } from '@growae/reactive'
```

`SignMessageErrorType` is `BaseErrorType | ErrorType` — a plain `Error` at the
type level, and on this action that is literal. Both of its own guards throw a
plain `Error`, so `instanceof BaseError` does not narrow them:

- `Error('No connected account')` — nothing is connected
- `Error('Connector does not support message signing')` — the connector has no `signMessage`

Past those guards the connector's own failures surface unwrapped. The bundled
connectors raise `ConnectorNotConnectedError` and `ProviderNotFoundError`; a
user declining the signature arrives as the wallet's own rejection.
