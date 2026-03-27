import { useNetworkId, useHeight } from '@growae/reactive-solid'

export function App() {
  const networkId = useNetworkId()
  const height = useHeight()

  return (
    <div style={{ 'font-family': 'system-ui', padding: '2rem' }}>
      <h1>Reactive + Solid</h1>
      <p>Network: {networkId.data ?? 'loading...'}</p>
      <p>Height: {height.data?.toString() ?? 'loading...'}</p>
    </div>
  )
}
