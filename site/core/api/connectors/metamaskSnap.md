# metamaskSnap

Connects to Aeternity through a MetaMask Snap using `wallet_requestSnaps` and `wallet_invokeSnap`.

## Import

```typescript
import { metamaskSnap } from '@growae/reactive/connectors'
```

## Usage

Requires MetaMask with the Aeternity snap approved.

```typescript
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { metamaskSnap } from '@growae/reactive/connectors'

const config = createConfig({
  networks: [testnet],
  connectors: [
    metamaskSnap({
      snapId: 'npm:@aeternity-snap/plugin',
      accountIndex: 0,
    }),
  ],
})
```

## Parameters

### snapId

- **Type:** `string`
- **Default:** `'npm:@aeternity-snap/plugin'`

Snap package id passed to MetaMask.

### snapVersion

- **Type:** `string`

Optional semver range forwarded as `version` in `wallet_requestSnaps`.

### accountIndex

- **Type:** `number`
- **Default:** `0`

HD derivation index for `getPublicKey` / signing requests.

### name

- **Type:** `string`
- **Default:** `'MetaMask Snap'`

Display name for the connector.

## Connector Details (type, id, capabilities)

| Field | Value |
| ----- | ----- |
| **type** | `'metamaskSnap'` |
| **id** | `'metamaskSnap'` |
| **name** | From `name` (default `'MetaMask Snap'`) |

**Runtime:** `window.ethereum` (MetaMask, Snaps). **API:** `wallet_requestSnaps`, then `wallet_invokeSnap` (`getPublicKey`, `signTransaction`, `signMessage`). **Capabilities:** `switchNetwork`, `signTransaction`, `signMessage`.
