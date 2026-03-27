# ReactiveProvider

React context provider that makes the Reactive `Config` available to all hooks in the component tree.

## Import

```typescript
import { ReactiveProvider } from '@reactive/react'
```

## Usage

```tsx
import { createConfig } from '@reactive/core'
import { testnet } from '@reactive/core/networks'
import { superhero } from '@reactive/core/connectors'
import { ReactiveProvider } from '@reactive/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

The Reactive config object created by `createConfig`.

### initialState

- **Type:** `State`
- **Optional**

Initial state for SSR hydration. Obtain this from `cookieToInitialState` or similar hydration utilities.

### reconnectOnMount

- **Type:** `boolean`
- **Default:** `true`

Automatically reconnect to previously connected wallets on mount.

## useConfig

Access the config from any child component:

```typescript
import { useConfig } from '@reactive/react'

function MyComponent() {
  const config = useConfig()
  // ...
}
```
