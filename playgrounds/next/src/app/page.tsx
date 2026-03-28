'use client'

import {
  useActiveAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useHeight,
  useNetworkId,
  useSwitchActiveAccount,
} from '@growae/reactive-react'

const card: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '1rem 1.5rem',
  marginBottom: '1rem',
  background: '#f8fafc',
}

const badge: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: '99px',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: '#dbeafe',
  color: '#1d4ed8',
  marginLeft: '0.5rem',
}

const activeBadge: React.CSSProperties = {
  ...badge,
  background: '#dcfce7',
  color: '#15803d',
}

const btn: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  marginRight: '0.5rem',
  fontSize: '0.85rem',
}

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
}

export default function Home() {
  const networkId = useNetworkId()
  const height = useHeight()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { address, addresses, isConnected } = useActiveAccount()
  const { switchActiveAccount } = useSwitchActiveAccount()
  // address is optional — defaults to active account automatically
  const balance = useBalance()

  return (
    <main
      style={{
        fontFamily: 'system-ui',
        padding: '2rem',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
        @growae/reactive — Next.js Playground
      </h1>
      <p
        style={{
          color: '#64748b',
          marginTop: 0,
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
        }}
      >
        Aeternity blockchain hooks for Next.js
      </p>

      {/* Network */}
      <div style={card}>
        <strong>Network</strong>
        <p
          style={{
            margin: '0.25rem 0 0',
            fontSize: '0.9rem',
            color: '#475569',
          }}
        >
          ID: {networkId.data ?? '…'}&nbsp;&nbsp;|&nbsp;&nbsp;Height:{' '}
          {height.data?.toString() ?? '…'}
        </p>
      </div>

      {/* Connect */}
      <div style={card}>
        <strong>Wallet</strong>
        <div style={{ marginTop: '0.75rem' }}>
          {!isConnected ? (
            connectors.map((c) => (
              <button
                type="button"
                key={c.id}
                style={btnPrimary}
                disabled={isConnecting}
                onClick={() => connect({ connector: c })}
              >
                {isConnecting ? 'Connecting…' : `Connect ${c.name}`}
              </button>
            ))
          ) : (
            <button type="button" style={btn} onClick={() => disconnect()}>
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Active account */}
      {isConnected && (
        <div style={card}>
          <strong>Active Account</strong>
          <p
            style={{
              margin: '0.25rem 0 0.75rem',
              fontSize: '0.85rem',
              wordBreak: 'break-all',
              color: '#0f172a',
            }}
          >
            {address}
          </p>

          <strong style={{ fontSize: '0.875rem' }}>All Accounts</strong>
          <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none' }}>
            {addresses?.map((addr) => (
              <li
                key={addr}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.4rem',
                }}
              >
                <code
                  style={{
                    fontSize: '0.8rem',
                    wordBreak: 'break-all',
                    flex: 1,
                  }}
                >
                  {addr.slice(0, 14)}…{addr.slice(-6)}
                </code>
                {addr === address ? (
                  <span style={activeBadge}>active</span>
                ) : (
                  <button
                    type="button"
                    style={{ ...btn, fontSize: '0.75rem', padding: '2px 10px' }}
                    onClick={() => switchActiveAccount({ account: addr })}
                  >
                    Switch
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Balance — address is optional, uses active account */}
      {isConnected && (
        <div style={card}>
          <strong>Balance</strong>
          <span style={badge}>uses active account automatically</span>
          <p
            style={{
              margin: '0.5rem 0 0',
              fontSize: '0.9rem',
              color: '#475569',
            }}
          >
            {balance.isLoading
              ? '…'
              : balance.error
                ? 'error fetching'
                : (balance.data ?? 'n/a')}
          </p>
        </div>
      )}
    </main>
  )
}
