# createStorage

Creates a storage adapter for persisting Reactive connection state (active connector, connected accounts, current network).

## Import

```typescript
import { createStorage } from '@growae/reactive'
```

## Usage

```typescript
import { createConfig, createStorage } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'

const config = createConfig({
  networks: [testnet],
  connectors: [superhero()],
  storage: createStorage({ storage: sessionStorage }),
})
```

## Parameters

### storage

- **Type:** `Storage` (Web Storage API compatible)
- **Default:** `localStorage`

The underlying storage backend. Must implement `getItem`, `setItem`, and `removeItem`.

### key

- **Type:** `string`
- **Default:** `'reactive'`

The key prefix used for all stored values.

### serialize

- **Type:** `(value: unknown) => string`
- **Default:** `JSON.stringify` with BigInt support

Custom serializer.

### deserialize

- **Type:** `(value: string) => unknown`
- **Default:** `JSON.parse` with BigInt support

Custom deserializer.

## Return Type

```typescript
type Storage = {
  getItem<T>(key: string): T | null
  setItem<T>(key: string, value: T): void
  removeItem(key: string): void
}
```

## Examples

### Session Storage

```typescript
const storage = createStorage({ storage: sessionStorage })
```

### No-op Storage (SSR)

```typescript
const storage = createStorage({
  storage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
})
```
