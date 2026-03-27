'use client'

import { createConfig, testnet } from '@growae/reactive'
import { ReactiveProvider } from '@growae/reactive-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

const config = createConfig({
  networks: [testnet],
  connectors: [],
})

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ReactiveProvider config={config}>{children}</ReactiveProvider>
    </QueryClientProvider>
  )
}
