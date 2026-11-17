# iframe

For dApps embedded in an iframe that talk to a wallet in the parent (or another) window via `postMessage`.

## Import

```typescript
import { iframe } from '@growae/reactive/connectors'
```

## Usage

Parent hosts the wallet; the dApp runs inside `<iframe src="https://your-dapp">` and targets the parent window:

```typescript
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { iframe } from '@growae/reactive/connectors'

const config = createConfig({
  networks: [testnet],
  connectors: [
    iframe({
      name: 'Embedded dApp',
      target: window.parent,
      origin: 'https://wallet.example',
    }),
  ],
})
```

## Parameters

### name

- **Type:** `string`
- **Default:** `'Reactive dApp'`

Handshake name for `WalletConnectorFrame.connect`.

### target

- **Type:** `Window`
- **Default:** `window.parent` in the browser

Window that owns the wallet side of the channel.

### origin

- **Type:** `string`

Expected wallet origin for validation on the message connection (recommended in production).

### debug

- **Type:** `boolean`
- **Default:** `false`

Debug logging for the underlying connection.

## Connector Details (type, id, capabilities)

| Field | Value |
| ----- | ----- |
| **type** | `'iframe'` |
| **id** | `'iframe'` |
| **name** | `'Iframe Wallet'` |

**Transport / signing:** `WalletConnectorFrame` + `BrowserWindowMessageConnection` to `target`; subscribes to account and network changes; `signTransaction`, `signMessage`.
