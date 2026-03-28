'use client'

import { createConfig, memory, testnet } from '@growae/reactive'
import { ReactiveProvider } from '@growae/reactive-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

const config = createConfig({
  networks: [testnet],
  connectors: [
    memory({
      accounts: [
        { secretKey: 'sk_2m9oLEdkrZup7jmtK6rCWVLmGdn8Bmqxd3enGZfYjLxrCpJmPf' },
        { secretKey: 'sk_ZxLc2E9eb2wLucHXtumzQPR1FmesiaragSNurALyrMA3Fz6aC' },
        { secretKey: 'sk_yLicaWqRyigTBAUddCcYtGbHAHZSMyt6guF2KSPMrd2LYY2h2' },
      ],
      name: 'Memory Wallet',
    }),
  ],
})

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ReactiveProvider config={config}>{children}</ReactiveProvider>
    </QueryClientProvider>
  )
}
