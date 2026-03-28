import { createConfig, mainnet, memory, testnet } from '@growae/reactive'
import { ReactiveProvider } from '@growae/reactive-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.js'

const config = createConfig({
  networks: [testnet, mainnet],
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

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ReactiveProvider config={config}>
        <App />
      </ReactiveProvider>
    </QueryClientProvider>
  </StrictMode>,
)
