import { render } from 'solid-js/web'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { ReactiveProvider } from '@growae/reactive-solid'
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'

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
