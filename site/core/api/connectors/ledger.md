# ledger

Hardware wallet connector for the Aeternity Ledger app via `AccountLedgerFactory` from `@aeternity/aepp-sdk`.

## Import

```typescript
import { ledger } from '@growae/reactive/connectors'
```

## Usage

Install **`@ledgerhq/hw-transport`** and a concrete transport (e.g. WebUSB). Create the transport, then pass it into `ledger()`:

```typescript
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { ledger } from '@growae/reactive/connectors'

const transport = await TransportWebUSB.create()

const config = createConfig({
  networks: [testnet],
  connectors: [
    ledger({
      transport,
      accountIndex: 0,
      name: 'Ledger',
    }),
  ],
})
```

## Parameters

### transport

- **Type:** `unknown` (runtime: `@ledgerhq/hw-transport` instance)
- **Required**

You create and own the transport (USB, HID, Bluetooth, etc.).

### accountIndex

- **Type:** `number`
- **Default:** `0`

BIP32 account index used with the Ledger app.

### name

- **Type:** `string`
- **Default:** `'Ledger'`

Label in connector lists.

## Connector Details (type, id, capabilities)

| Field | Value |
| ----- | ----- |
| **type** | `'ledger'` |
| **id** | `'ledger'` |
| **name** | From `name` parameter (default `'Ledger'`) |

**Peer dependency:** `@ledgerhq/hw-transport` (version per `@growae/reactive-connectors`).

**Provider:** `AccountLedgerFactory` from the SDK.

**Capabilities:** `switchNetwork`, `signTransaction`, `signMessage`.
