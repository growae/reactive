# Error Handling

Reactive uses a structured error hierarchy rooted in `BaseError`. Every error
carries a human-readable summary, a class name, optional details lifted from the
underlying cause, and — for the errors that have something specific to say —
`metaMessages`.

Every class named on this page is exported from the package root, and a test
(`packages/core/src/errors/documentedErrors.test.ts`) reads this file and fails
if a name here is not an actual export.

## BaseError

All Reactive errors extend `BaseError`:

```typescript
import { BaseError, callContract } from '@growae/reactive'

try {
  await callContract(config, { address: 'ct_...', aci, method: 'transfer' })
} catch (error) {
  if (error instanceof BaseError) {
    console.log(error.shortMessage) // human-readable summary
    console.log(error.name) // error class name
    console.log(error.details) // cause message, or the details passed in
    console.log(error.metaMessages) // hints, when the error has any
  }
}
```

`BaseError` also exposes `walk(predicate?)`, which follows the `cause` chain —
`error.walk()` returns the deepest cause, and `error.walk(fn)` the first link
matching `fn`.

Not every rejection is a `BaseError`. Several actions still surface the
underlying SDK or network failure unchanged, so `instanceof BaseError` is a
narrowing, not a guarantee — keep an `else` branch that rethrows.

## Error Categories

Classes marked † are exported and constructible but are not thrown by any code
path in the package today. They are part of the public surface, so catching them
is harmless, but nothing currently produces one.

### Configuration and Connection Errors

From `packages/core/src/errors/config.ts`.

| Error | When |
|-------|------|
| `NetworkNotConfiguredError` | The requested `networkId` is not in `createConfig({ networks })`. Thrown by config's node resolution, by `switchNetwork`, and by the connectors when asked to switch |
| `ConnectorNotFoundError` | `switchConnection` was given a connector uid that is not in the config |
| `ConnectorAlreadyConnectedError` | `connect` was called for a connector that already holds a connection |
| `ConnectorNotConnectedError` | A connector method that needs a live provider or account was called while disconnected |
| `ConnectorUnavailableReconnectingError` † | Reserved for connector access during reconnection, when only `id`, `name`, `type` and `uid` are guaranteed |

### Connector Errors

From `packages/core/src/errors/connector.ts`.

| Error | When |
|-------|------|
| `ProviderNotFoundError` | The wallet provider is not present — no injected extension, no iframe parent, no Snap |
| `SwitchNetworkNotSupportedError` † | Reserved for connectors without programmatic network switching |

### Account Errors

From `packages/core/src/errors/account.ts`.

| Error | When |
|-------|------|
| `AccountNotFoundError` | `switchActiveAccount` was given an address that is not on the active connection |
| `AccountNotConnectedError` † | Reserved for an account that is known but not connected |

### Node Errors

From `packages/core/src/errors/node.ts`.

| Error | When |
|-------|------|
| `NodeNotFoundError` † | Reserved for a network with no node client resolved |
| `NodeConnectionError` † | Reserved for a failed connection to a node URL; carries the cause |

Node HTTP failures today arrive as the `@aeternity/aepp-sdk` error, unwrapped.

### Contract Errors

| Error | When |
|-------|------|
| `DeployContractNoCodeError` | `deployContract` was called with neither `sourceCode` nor `bytecode` |
| `DeployContractNoAccountError` | `deployContract` was called without a connected account |
| `DeployContractMapKeyOrderError` | A `map` init argument would be serialised in a key order the node's decoder refuses. Refused locally, before anything is posted |
| `DeployContractInvocationError` | The node executed `init` and refused it. Carries `reason`, `transaction` and `transactionHash` |
| `CallContractNoAccountError` | `callContract` was called without a connected account |
| `CallContractMapKeyOrderError` | A `map` argument would be serialised in a key order the node's decoder refuses. Refused locally, before anything is posted |
| `CallContractInvocationError` | The node executed the call and refused it. Carries `reason`, `transaction` and `transactionHash` |
| `SimulateContractMapKeyOrderError` | The same map-ordering defect on the `simulateContract` / `readContract` dry-run path |
| `CompileContractNoCompilerError` | `compileContract` was called without `onCompiler` |

The three map-ordering classes each carry a `defects` array naming the arguments
whose keys the encoder and the node disagree about. No insertion order avoids
the defect — the encoder sorts the entries itself — so the error is a refusal,
not a hint to reorder the argument.

### AENS Errors

| Error | When |
|-------|------|
| `BidNameNoAccountError` | `bidName` was called without a connected account |
| `RevokeNameNoAccountError` | `revokeName` was called without a connected account |
| `TransferNameNoAccountError` | `transferName` was called without a connected account |

### Oracle Errors

| Error | When |
|-------|------|
| `RegisterOracleNoAccountError` | `registerOracle` was called without a connected account |
| `QueryOracleNoAccountError` | `queryOracle` was called without a connected account |
| `RespondToQueryNoAccountError` | `respondToQuery` was called without a connected account |
| `ExtendOracleNoAccountError` | `extendOracle` was called without a connected account |

### Generalized Account Errors

| Error | When |
|-------|------|
| `CreateGANoAccountError` | `createGeneralizedAccount` was called without a connected account |
| `CreateGANoCodeError` | `createGeneralizedAccount` was called with neither `sourceCode` nor `bytecode` |

### State Channel Errors

| Error | When |
|-------|------|
| `CloseChannelError` | `closeChannel` failed; the channel's own message is in `shortMessage` |
| `OpenChannelNoAccountError` † | Reserved for `openChannel` without a connected account |

## Catching Specific Errors

`instanceof` is the narrowing that works:

```typescript
import {
  CallContractInvocationError,
  CallContractMapKeyOrderError,
  CallContractNoAccountError,
  callContract,
} from '@growae/reactive'

try {
  await callContract(config, { address: 'ct_...', aci, method: 'transfer' })
} catch (error) {
  if (error instanceof CallContractNoAccountError) {
    console.log('Connect a wallet first')
  } else if (error instanceof CallContractMapKeyOrderError) {
    // Refused locally — nothing was posted and no gas was spent.
    console.log('Unsupported map argument:', error.defects)
  } else if (error instanceof CallContractInvocationError) {
    console.log('Node refused the call:', error.reason, error.transactionHash)
  } else {
    throw error
  }
}
```

Do not narrow on `error.name`. The classes assign `name` as a mutable property
typed `string`, so comparing it tells TypeScript nothing and the branch stays
untyped. The `*ErrorType` aliases that some classes ship —
`CallContractMapKeyOrderErrorType`, `NetworkNotConfiguredErrorType` and their
siblings — are the branded shapes that carry a literal `name`; they exist for
typing values, not for narrowing at runtime.

## Error Types per Action

Actions export an error union type alongside their parameter and return types:

```typescript
import type {
  CallContractErrorType,
  DeployContractErrorType,
  GetBalanceErrorType,
  SpendErrorType,
} from '@growae/reactive'
```

The unions differ in how much they promise. `CallContractErrorType` and
`DeployContractErrorType` name their concrete classes. Most other actions —
`SpendErrorType`, `GetBalanceErrorType` and the rest — are still
`BaseErrorType | ErrorType`, which is a plain `Error` at the type level.
Narrowing with `instanceof BaseError` is what gets you `shortMessage` on those.

## TanStack Query Integration

When using Reactive with the framework packages (React, Vue, Solid), errors are
surfaced through TanStack Query's error state, typed with the same union:

```typescript
import { BaseError } from '@growae/reactive'

const { error } = useBalance({ address: 'ak_...' })

// error is GetBalanceErrorType | null, which is BaseErrorType | ErrorType
if (error instanceof BaseError) {
  console.log(error.shortMessage)
} else if (error) {
  console.log(error.message)
}
```
