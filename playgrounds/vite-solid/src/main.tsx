import { createConfig, memory, testnet } from '@growae/reactive'
import { ReactiveProvider } from '@growae/reactive-solid'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { render } from 'solid-js/web'
import { App } from './App.js'

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
