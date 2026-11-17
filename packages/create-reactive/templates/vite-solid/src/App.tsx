import { useHeight } from '@growae/reactive-solid'

export default function App() {
  const height = useHeight()
  return (
    <main>
      <h1>æternity testnet</h1>
      <p>
        {height.isError
          ? height.error.message
          : (height.data ?? 'Loading key-block height…')}
      </p>
    </main>
  )
}
