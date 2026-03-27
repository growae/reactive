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

- `ConnectorAlreadyConnectedError` — already connected
- `ConnectorNotFoundError` — connector not registered in config
- `UserRejectedRequestError` — user rejected the connection request
