import { useBalance, useConnect, useDisconnect } from '@growae/reactive-solid'
import { For, Show } from 'solid-js'

function App() {
  const { connect, connectors, status, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance()

  return (
    <div>
      <h1>Reactive App</h1>

      <div>
        <h2>Connect</h2>
        <For each={connectors()}>
          {(connector) => (
            <button onClick={() => connect({ connector })}>
              {connector.name}
            </button>
          )}
        </For>
        <div>{status()}</div>
        <Show when={error()}>
          <div>{error()!.message}</div>
        </Show>
      </div>

      <Show when={balance() !== undefined}>
        <div>
          <h2>Balance</h2>
          <p>{balance()?.toString()} aettos</p>
        </div>
      </Show>

      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  )
}

export default App
