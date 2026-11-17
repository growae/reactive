# walletDetect

Async utility that scans for Aeternity wallets on the page (extensions, iframe hosts) using the SDK wallet detector.

## Import

```typescript
import { walletDetect } from '@growae/reactive/connectors'
```

## Usage

```typescript
import { walletDetect } from '@growae/reactive/connectors'

const { wallets, stop } = await walletDetect({
  timeout: 5000,
  onDetected: (w) => console.log(w.name, w.id),
})
// …read `wallets`, then:
stop()
```

## Parameters

### debug

- **Type:** `boolean`
- **Default:** `false`

Enables debug logging on the scanner `BrowserWindowMessageConnection`.

### timeout

- **Type:** `number`

If set and positive, automatically calls `stop()` after this many milliseconds.

### onDetected

- **Type:** `(wallet: DetectedWallet) => void`

Optional callback invoked each time a new wallet is discovered.

## Return value

Resolves to `{ wallets: Map<string, DetectedWallet>, stop: () => void }`. Call `stop()` to end scanning (and clear a `timeout` timer).

```typescript
type WalletDetectResult = {
  wallets: Map<string, DetectedWallet>
  stop: () => void
}
```

## Connector Details (type, id, capabilities)

**Not a connector** — no `Connector` `type` / `id`. Use hits for UI or custom wiring; sessions use [`webExtension()`](/core/api/connectors/webExtension) or other connectors.

```typescript
type DetectedWallet = { id: string; name: string; networkId: string; type: string; origin: string }
```
