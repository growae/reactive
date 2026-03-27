import { render } from 'solid-js/web'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { ReactiveProvider } from '@reactive/solid'
import { createConfig } from '@reactive/core'
import { testnet } from '@reactive/core/networks'

import App from './App.tsx'

const config = createConfig({
  networks: [testnet],
  connectors: [],
})

const queryClient = new QueryClient()

render(
  () => (
    <ReactiveProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ReactiveProvider>
  ),
  document.getElementById('root')!,
)
