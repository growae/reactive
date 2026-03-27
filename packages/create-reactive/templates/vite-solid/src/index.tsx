import { createConfig } from '@growae/reactive'
import { ReactiveProvider } from '@growae/reactive-solid'
import { testnet } from '@growae/reactive/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { render } from 'solid-js/web'

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
