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

- `ConnectorNotConnectedError` — no wallet connected
- `NodeRequestError` — the node returned an error
