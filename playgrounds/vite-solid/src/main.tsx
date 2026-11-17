import { createConfig, mainnet, testnet } from '@growae/reactive'
import { metamaskSnap } from '@growae/reactive-connectors'
import { ReactiveProvider } from '@growae/reactive-solid'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { render } from 'solid-js/web'
import { App } from './App.js'

const config = createConfig({
  networks: [testnet, mainnet],
  connectors: [metamaskSnap()],
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
