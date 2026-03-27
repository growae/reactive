# signMessage

Signs an arbitrary message with the connected account's private key.

## Import

```typescript
import { signMessage } from '@reactive/core/actions'
```

## Usage

```typescript
import { signMessage } from '@reactive/core/actions'

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
import type { SignMessageErrorType } from '@reactive/core'
```

- `ConnectorNotConnectedError` — no wallet connected
- `UserRejectedRequestError` — user rejected the signing request
