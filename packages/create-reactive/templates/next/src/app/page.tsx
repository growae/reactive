'use client'

import { useBalance, useConnect, useDisconnect } from '@growae/reactive-react'

export default function Home() {
  const { connect, connectors, status, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance()

  return (
    <main>
      <h1>Reactive App</h1>

      <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
        {error && <div>{error.message}</div>}
      </div>

      {balance !== undefined && (
        <div>
          <h2>Balance</h2>
          <p>{balance.toString()} aettos</p>
        </div>
      )}

      <button type="button" onClick={() => disconnect()}>
        Disconnect
      </button>
    </main>
  )
}
