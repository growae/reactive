# Installation

## Package Manager

::: code-group

```bash [pnpm]
pnpm add @growae/reactive-solid @tanstack/solid-query
```

```bash [npm]
npm install @growae/reactive-solid @tanstack/solid-query
```

```bash [yarn]
yarn add @growae/reactive-solid @tanstack/solid-query
```

:::

## Requirements

- **Solid** 1.8+
- **TypeScript** 5.0+ (recommended)
- **@tanstack/solid-query** 5+

## Peer Dependencies

| Package | Version |
|---------|---------|
| `solid-js` | `>=1.8.0` |
| `@tanstack/solid-query` | `>=5.0.0` |

## SolidStart Setup

For SolidStart with SSR:

```tsx
// src/root.tsx
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { superhero } from '@growae/reactive/connectors'
import { ReactiveProvider } from '@growae/reactive-solid'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'

const config = createConfig({
  networks: [testnet],
  connectors: [superhero()],
  ssr: true,
})

const queryClient = new QueryClient()

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactiveProvider config={config}>
        {/* routes */}
      </ReactiveProvider>
    </QueryClientProvider>
  )
}
```
