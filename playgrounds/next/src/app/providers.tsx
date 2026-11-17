'use client'

import { createConfig, mainnet, testnet } from '@growae/reactive'
import { metamaskSnap } from '@growae/reactive-connectors'
import { ReactiveProvider } from '@growae/reactive-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

const config = createConfig({
  networks: [testnet, mainnet],
  connectors: [metamaskSnap()],
})

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ReactiveProvider config={config}>{children}</ReactiveProvider>
    </QueryClientProvider>
  )
}
