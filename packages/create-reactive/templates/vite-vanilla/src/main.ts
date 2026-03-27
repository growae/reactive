import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'

const config = createConfig({
  networks: [testnet],
  connectors: [],
})

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>Reactive App</h1>
  <p>Network: ${config.state.current}</p>
  <p>Edit <code>src/main.ts</code> and save to reload.</p>
`
