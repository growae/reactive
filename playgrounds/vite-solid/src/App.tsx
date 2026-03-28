import {
  useActiveAccount,
  useBalance,
  useConnect,
  useConnectors,
  useDisconnect,
  useHeight,
  useNetworkId,
  useSwitchActiveAccount,
} from '@growae/reactive-solid'
import { For, Show } from 'solid-js'

const card = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '1rem 1.5rem',
  'margin-bottom': '1rem',
  background: '#f8fafc',
}

const badge = {
  display: 'inline-block',
  padding: '2px 10px',
  'border-radius': '99px',
  'font-size': '0.75rem',
  'font-weight': '600',
  background: '#dbeafe',
  color: '#1d4ed8',
  'margin-left': '0.5rem',
}

const activeBadge = { ...badge, background: '#dcfce7', color: '#15803d' }

const btn = {
  padding: '6px 14px',
  'border-radius': '6px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  'margin-right': '0.5rem',
  'font-size': '0.85rem',
}

const btnPrimary = {
  ...btn,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
}

export function App() {
  const networkId = useNetworkId()
  const height = useHeight()
  // In Solid, useConnect/useDisconnect/useSwitchActiveAccount return mutations
  const connectMutation = useConnect()
  const disconnectMutation = useDisconnect()
  const switchMutation = useSwitchActiveAccount()
  // useConnectors returns an Accessor<Connector[]> — must call it as connectors()
  const connectors = useConnectors()
  // useActiveAccount returns an Accessor<GetActiveAccountReturnType> — call as activeAccount()
  const activeAccount = useActiveAccount()
  // address is optional — defaults to active account automatically
  const balance = useBalance()

  return (
    <div
      style={{
        'font-family': 'system-ui',
        padding: '2rem',
        'max-width': '600px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ 'font-size': '1.5rem', 'margin-bottom': '0.25rem' }}>
        @growae/reactive — Solid Playground
      </h1>
      <p
        style={{
          color: '#64748b',
          'margin-top': '0',
          'margin-bottom': '1.5rem',
          'font-size': '0.9rem',
        }}
      >
        Aeternity blockchain primitives for Solid
      </p>

      {/* Network */}
      <div style={card}>
        <strong>Network</strong>
        <p
          style={{
            margin: '0.25rem 0 0',
            'font-size': '0.9rem',
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
        <div style={{ 'margin-top': '0.75rem' }}>
          <Show
            when={activeAccount().isConnected}
            fallback={
              <For each={connectors()}>
                {(c) => (
                  <button
                    type="button"
                    style={btnPrimary}
                    disabled={connectMutation.isPending}
                    onClick={() => connectMutation.mutate({ connector: c })}
                  >
                    {connectMutation.isPending
                      ? 'Connecting…'
                      : `Connect ${c.name}`}
                  </button>
                )}
              </For>
            }
          >
            <button
              type="button"
              style={btn}
              onClick={() => disconnectMutation.mutate({})}
            >
              Disconnect
            </button>
          </Show>
        </div>
      </div>

      {/* Active account */}
      <Show when={activeAccount().isConnected}>
        <div style={card}>
          <strong>Active Account</strong>
          <p
            style={{
              margin: '0.25rem 0 0.75rem',
              'font-size': '0.85rem',
              'word-break': 'break-all',
              color: '#0f172a',
            }}
          >
            {activeAccount().address}
          </p>

          <strong style={{ 'font-size': '0.875rem' }}>All Accounts</strong>
          <ul
            style={{ margin: '0.5rem 0 0', padding: '0', 'list-style': 'none' }}
          >
            <For each={activeAccount().addresses}>
              {(addr) => (
                <li
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '0.5rem',
                    'margin-bottom': '0.4rem',
                  }}
                >
                  <code
                    style={{
                      'font-size': '0.8rem',
                      'word-break': 'break-all',
                      flex: '1',
                    }}
                  >
                    {addr.slice(0, 14)}…{addr.slice(-6)}
                  </code>
                  <Show
                    when={addr === activeAccount().address}
                    fallback={
                      <button
                        type="button"
                        style={{
                          ...btn,
                          'font-size': '0.75rem',
                          padding: '2px 10px',
                        }}
                        onClick={() => switchMutation.mutate({ account: addr })}
                      >
                        Switch
                      </button>
                    }
                  >
                    <span style={activeBadge}>active</span>
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </div>

        {/* Balance — address is optional, uses active account */}
        <div style={card}>
          <strong>Balance</strong>
          <span style={badge}>uses active account automatically</span>
          <p
            style={{
              margin: '0.5rem 0 0',
              'font-size': '0.9rem',
              color: '#475569',
            }}
          >
            {balance.isLoading
              ? '…'
              : balance.error
                ? 'error fetching'
                : (balance.data?.toString() ?? 'n/a')}
          </p>
        </div>
      </Show>
    </div>
  )
}
