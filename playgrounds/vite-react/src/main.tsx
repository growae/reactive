import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig } from '@reactive/core'
import { testnet } from '@reactive/core'
import { ReactiveProvider } from '@reactive/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.js'

const config = createConfig({
  networks: [testnet],
  connectors: [],
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
