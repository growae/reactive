# connect

Connects to a wallet via a connector. Returns the connected accounts and network.

## Import

```typescript
import { connect } from '@growae/reactive/actions'
```

## Usage

```typescript
import { connect } from '@growae/reactive/actions'
import { superhero } from '@growae/reactive/connectors'

const result = await connect(config, {
  connector: superhero(),
})
```

## Return Type

```typescript
type ConnectReturnType = {
  accounts: readonly string[]
  networkId: string
}
```

### accounts

- **Type:** `readonly string[]`

The connected account addresses (`ak_...`).

### networkId

- **Type:** `string`

The wallet's active network ID (e.g. `ae_mainnet`, `ae_uat`).

## Parameters

### connector

- **Type:** `Connector`
- **Required**

The connector instance to use for connecting.

## Error Types

```typescript
import type { ConnectErrorType } from '@growae/reactive'
```

`ConnectErrorType` is `ConnectorAlreadyConnectedErrorType | BaseErrorType |
ErrorType`. What the action raises:

- `ConnectorAlreadyConnectedError` — the connector already holds the current connection
- Whatever the connector's own `connect` throws, unwrapped. The bundled connectors raise `ProviderNotFoundError` when the wallet provider is not present, and `NetworkNotConfiguredError` from the ones that validate the requested `networkId` against the config

A user declining the request in their wallet arrives as the wallet's own
rejection, not as a Reactive error class. `connect` restores the previous
`status` before rethrowing, so a failed attempt leaves the config as it found
it.

`ConnectorNotFoundError` is not raised here — it belongs to `switchConnection`,
for a connector uid that is not in the config.
