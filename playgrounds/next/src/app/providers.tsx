'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig, testnet } from '@reactive/core'
import { ReactiveProvider } from '@reactive/react'
import { useState, type ReactNode } from 'react'

const config = createConfig({
  networks: [testnet],
  connectors: [],
})

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ReactiveProvider config={config}>
        {children}
      </ReactiveProvider>
    </QueryClientProvider>
  )
}
