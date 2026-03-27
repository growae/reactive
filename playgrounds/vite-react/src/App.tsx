import { useNetworkId, useHeight, useBalance, useConnect, useDisconnect } from '@growae/reactive-react'

export function App() {
  const networkId = useNetworkId()
  const height = useHeight()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <div style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>Reactive + React</h1>
      <p>Network: {networkId.data ?? 'loading...'}</p>
      <p>Height: {height.data?.toString() ?? 'loading...'}</p>

      <h2>Connectors</h2>
      {connectors.map((connector) => (
        <button key={connector.id} onClick={() => connect({ connector })}>
          {connector.name}
        </button>
      ))}
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  )
}
