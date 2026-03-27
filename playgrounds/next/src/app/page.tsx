'use client'

import { useNetworkId, useHeight } from '@reactive/react'

export default function Home() {
  const networkId = useNetworkId()
  const height = useHeight()

  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>Reactive + Next.js</h1>
      <p>Network: {networkId.data ?? 'loading...'}</p>
      <p>Height: {height.data?.toString() ?? 'loading...'}</p>
    </main>
  )
}
