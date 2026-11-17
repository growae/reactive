import { useHeight } from '@growae/reactive-solid'
export function App() {
  const height = useHeight()
  return (
    <main>
      <h1>æternity testnet</h1>
      <p>Key-block height: {height.data ?? 'Loading…'}</p>
    </main>
  )
}
