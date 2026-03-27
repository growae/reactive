# Error Handling

Reactive uses a structured error hierarchy rooted in `BaseError`. Every error includes a human-readable message, a short name, and optional metadata.

## BaseError

All Reactive errors extend `BaseError`:

```typescript
import { BaseError } from '@reactive/core'

try {
  await spend(config, { recipient: 'ak_...', amount: '10' })
} catch (error) {
  if (error instanceof BaseError) {
    console.log(error.shortMessage) // human-readable summary
    console.log(error.name) // error class name
    console.log(error.details) // additional context
  }
}
```

## Error Categories

### Configuration Errors

| Error | When |
|-------|------|
| `NetworkNotConfiguredError` | Target network is not in the config |
| `ConnectorNotFoundError` | Connector is not registered |
| `StorageError` | Storage read/write failed |

### Connection Errors

| Error | When |
|-------|------|
| `ConnectorNotConnectedError` | Action requires a connected wallet |
| `ConnectorAlreadyConnectedError` | Attempting to connect when already connected |
| `UserRejectedRequestError` | User rejected the wallet prompt |

### Transaction Errors

| Error | When |
|-------|------|
| `InsufficientBalanceError` | Not enough AE for the transaction |
| `TransactionRejectedError` | Node rejected the transaction |
| `TransactionExpiredError` | Transaction TTL exceeded |

### Contract Errors

| Error | When |
|-------|------|
| `ContractNotFoundError` | No contract at the specified address |
| `ContractCallError` | Contract call reverted or failed |
| `ContractDeployError` | Deployment failed |

### Node Errors

| Error | When |
|-------|------|
| `NodeRequestError` | HTTP request to AE node failed |
| `NodeTimeoutError` | Node request timed out |

## Catching Specific Errors

```typescript
import {
  InsufficientBalanceError,
  ConnectorNotConnectedError,
} from '@reactive/core'

try {
  await spend(config, { recipient: 'ak_...', amount: '10' })
} catch (error) {
  if (error instanceof InsufficientBalanceError) {
    console.log('Not enough AE:', error.shortMessage)
  } else if (error instanceof ConnectorNotConnectedError) {
    console.log('Please connect your wallet first')
  } else {
    throw error
  }
}
```

## Error Types per Action

Every action exports its error union type:

```typescript
import type {
  SpendErrorType,
  GetBalanceErrorType,
  CallContractErrorType,
} from '@reactive/core'
```

Use these types for exhaustive error handling in TypeScript.

## TanStack Query Integration

When using Reactive with framework packages (React, Vue, Solid), errors are surfaced through TanStack Query's error state:

```typescript
const { error } = useBalance({ address: 'ak_...' })

if (error) {
  // error is typed as GetBalanceErrorType
  console.log(error.shortMessage)
}
```
