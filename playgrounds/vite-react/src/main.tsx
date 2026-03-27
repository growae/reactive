import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive'
import { ReactiveProvider } from '@growae/reactive-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
