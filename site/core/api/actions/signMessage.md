# signMessage

Signs an arbitrary message with the connected account's private key.

## Import

```typescript
import { signMessage } from '@growae/reactive/actions'
```

## Usage

```typescript
import { signMessage } from '@growae/reactive/actions'

const { signature } = await signMessage(config, {
  message: 'Hello, Aeternity!',
})
```

## Return Type

```typescript
type SignMessageReturnType = {
  signature: string
}
```

### signature

- **Type:** `string`

The hex-encoded signature.

The signing address is not returned. `signMessage` answers with the signature
alone, so a caller that needs to know which account produced it reads that from
`getActiveAccount`, or passes `onAccount` and already knows.

## Parameters

### message

- **Type:** `string`
- **Required**

The message to sign.

### onAccount

- **Type:** `string`
- **Optional**

The account to sign the message with. Defaults to the active account of the
current connection — the same account `getActiveAccount` reports and
`switchActiveAccount` sets. Pass it explicitly to sign with some other account
the connector holds.

The connector signs with exactly this account or throws
`ConnectorAccountUnavailableError`; it never falls back to another one. Naming
an account the connector does not hold is therefore an error rather than a
signature from a different address.

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
connectors raise `ConnectorAccountUnavailableError` for an `onAccount` they do
not hold — a `BaseError` subclass, so `instanceof` narrows it — along with
`ConnectorNotConnectedError` and `ProviderNotFoundError`; a user declining the
signature arrives as the wallet's own rejection.
