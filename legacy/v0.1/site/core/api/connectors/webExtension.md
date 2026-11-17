# webExtension

Auto-detects an Aeternity browser-extension wallet and connects to the first wallet reported by the SDK wallet detector.

## Import

```typescript
import { webExtension } from '@growae/reactive/connectors'
```

## Usage

```typescript
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { webExtension } from '@growae/reactive/connectors'

const config = createConfig({
  networks: [testnet],
  connectors: [webExtension({ name: 'Reactive dApp' })],
})
```

## Parameters

### name

- **Type:** `string`
- **Default:** `'Reactive dApp'`

Advertised dApp name for `WalletConnectorFrame.connect`.

### debug

- **Type:** `boolean`
- **Default:** `false`

Debug logging for the detector scan connection and runtime bridge.

## Connector Details (type, id, capabilities)

| Field | Value |
| ----- | ----- |
| **type** | `'webExtension'` |
| **id** | `'webExtension'` |
| **name** | `'Web Extension Wallet'` |

**Detection:** Uses `walletDetector` from `@aeternity/aepp-sdk` with a `BrowserWindowMessageConnection`; resolves the first `newWallet` and opens `WalletConnectorFrame` on that wallet’s connection.

**Behaviour:** Subscribes to account and network changes like other frame-based connectors.

**Signing:** `signTransaction`, `signMessage`.
