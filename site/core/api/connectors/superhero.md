# superhero

Connects to the Superhero Wallet browser extension using the Aeternity SDK frame protocol.

## Import

```typescript
import { superhero } from '@growae/reactive/connectors'
```

## Usage

```typescript
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { superhero } from '@growae/reactive/connectors'

const config = createConfig({
  networks: [testnet],
  connectors: [superhero({ name: 'My dApp', debug: false })],
})
```

## Parameters

### name

- **Type:** `string`
- **Default:** `'Reactive dApp'`

Name shown to the wallet during the connection handshake.

### debug

- **Type:** `boolean`
- **Default:** `false`

Enables debug logging on the underlying `BrowserWindowMessageConnection`.

## Connector Details (type, id, capabilities)

| Field | Value |
| ----- | ----- |
| **type** | `'superhero'` |
| **id** | `'superhero'` |
| **name** | `'Superhero Wallet'` |

**Transport:** `WalletConnectorFrame` over `BrowserWindowMessageConnection` (extension ↔ page messaging).

**Behaviour:** Subscribes to account and network changes on the frame; propagates them through the config emitter.

**Signing:** `signTransaction`, `signMessage`.
