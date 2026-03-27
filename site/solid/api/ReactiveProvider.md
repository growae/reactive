# ReactiveProvider

Solid context provider that makes the Reactive `Config` available to all primitives in the component tree.

## Import

```typescript
import { ReactiveProvider } from '@growae/reactive-solid'
```

## Usage

```tsx
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { superhero } from '@growae/reactive/connectors'
import { ReactiveProvider } from '@growae/reactive-solid'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'

const config = createConfig({
  networks: [testnet],
  connectors: [superhero()],
})

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactiveProvider config={config}>
        <YourApp />
      </ReactiveProvider>
    </QueryClientProvider>
  )
}
```

## Props

### config

- **Type:** `Config`
- **Required**

The Reactive config created by `createConfig`.

### reconnectOnMount

- **Type:** `boolean`
- **Default:** `true`

Automatically reconnect to previously connected wallets on mount.

## useConfig

Access the config from any child component:

```typescript
import { useConfig } from '@growae/reactive-solid'

function MyComponent() {
  const config = useConfig()
  // ...
}
```
