import { render } from 'solid-js/web'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { createConfig, testnet } from '@growae/reactive'
import { ReactiveProvider } from '@growae/reactive-solid'
import { App } from './App.js'

const config = createConfig({
  networks: [testnet],
  connectors: [],
})

const queryClient = new QueryClient()

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <ReactiveProvider config={config}>
        <App />
      </ReactiveProvider>
    </QueryClientProvider>
  ),
  document.getElementById('root')!,
)
