# signDelegation

Signs a delegation transaction.

## Import

```typescript
import { signDelegation } from '@growae/reactive/actions'
```

## Usage

```typescript
import { signDelegation } from '@growae/reactive/actions'

const signature = await signDelegation(config, {
  delegation: packed,
})
```

## Return Type

```typescript
type SignDelegationReturnType = string
```

The delegation signature as a string.

## Parameters

### delegation

- **Type:** `any`
- **Required**

The packed delegation to sign.

### networkId

- **Type:** `string`
- **Optional**

Target network. Defaults to the currently active network.

### account

- **Type:** `string`
- **Optional**

Account address to sign with. Defaults to the active account.

### connector

- **Type:** `Connector`
- **Optional**

Connector to use for signing. Defaults to the active connector.

## Error Types

```typescript
import type { SignDelegationErrorType } from '@growae/reactive'
```

`SignDelegationErrorType` is `BaseErrorType | ErrorType` — a plain `Error` at
the type level, and on this action that is literal. Both of its own guards throw
a plain `Error`, so `instanceof BaseError` does not narrow them:

- `Error('No connector found. Connect a wallet first.')` — no `connector` was passed and nothing is connected
- `Error('Connector "<name>" does not support delegation signing.')` — the connector has no `signDelegation`

Past those guards the connector's own failures surface unwrapped. Delegation
signing is not part of the connector interface, so whether a given connector
supports it, and what it throws when it refuses, is that connector's own
business.
