# Installation

## Package Manager

::: code-group

```bash [pnpm]
pnpm add @reactive/react @tanstack/react-query
```

```bash [npm]
npm install @reactive/react @tanstack/react-query
```

```bash [yarn]
yarn add @reactive/react @tanstack/react-query
```

:::

## Requirements

- **React** 18+
- **TypeScript** 5.0+ (recommended)
- **@tanstack/react-query** 5+

## Peer Dependencies

`@reactive/react` has the following peer dependencies:

| Package | Version |
|---------|---------|
| `react` | `>=18.0.0` |
| `@tanstack/react-query` | `>=5.0.0` |

## Next.js Setup

For Next.js (App Router), ensure the provider is in a client component:

```tsx
// app/providers.tsx
'use client'

import { createConfig } from '@reactive/core'
import { testnet } from '@reactive/core/networks'
import { superhero } from '@reactive/core/connectors'
import { ReactiveProvider } from '@reactive/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const config = createConfig({
  networks: [testnet],
  connectors: [superhero()],
  ssr: true,
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactiveProvider config={config}>
        {children}
      </ReactiveProvider>
    </QueryClientProvider>
  )
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```
