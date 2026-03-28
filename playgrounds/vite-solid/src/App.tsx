import { compileContract } from '@growae/reactive'
import {
  toAe,
  useActiveAccount,
  useBalance,
  useCallContract,
  useConfig,
  useConnect,
  useConnectors,
  useDeployContract,
  useDisconnect,
  useHeight,
  useNetworkId,
  useNetworks,
  useReadContract,
  useSignMessage,
  useSignTypedData,
  useSpend,
  useSwitchActiveAccount,
  useSwitchNetwork,
  useVerifyMessage,
} from '@growae/reactive-solid'
import { For, Show, createSignal } from 'solid-js'
import type { JSX } from 'solid-js'

// ─── Styles ─────────────────────────────────────────────────────

const card: JSX.CSSProperties = {
  border: '1px solid #e2e8f0',
  'border-radius': '8px',
  padding: '1rem 1.5rem',
  'margin-bottom': '1rem',
  background: '#f8fafc',
}

const badge: JSX.CSSProperties = {
  display: 'inline-block',
  padding: '2px 10px',
  'border-radius': '99px',
  'font-size': '0.75rem',
  'font-weight': '600',
  background: '#dbeafe',
  color: '#1d4ed8',
  'margin-left': '0.5rem',
}

const activeBadge: JSX.CSSProperties = {
  ...badge,
  background: '#dcfce7',
  color: '#15803d',
}

const btn: JSX.CSSProperties = {
  padding: '6px 14px',
  'border-radius': '6px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  'margin-right': '0.5rem',
  'font-size': '0.85rem',
}

const btnPrimary: JSX.CSSProperties = {
  ...btn,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
}

const btnDanger: JSX.CSSProperties = {
  ...btn,
  background: '#dc2626',
  color: '#fff',
  border: 'none',
}

const input: JSX.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  'border-radius': '6px',
  border: '1px solid #cbd5e1',
  'font-size': '0.85rem',
  'font-family': 'monospace',
  'box-sizing': 'border-box',
}

const textarea: JSX.CSSProperties = {
  ...input,
  'min-height': '80px',
  resize: 'vertical',
}

const label: JSX.CSSProperties = {
  display: 'block',
  'font-size': '0.8rem',
  'font-weight': '600',
  color: '#475569',
  'margin-bottom': '4px',
  'margin-top': '0.75rem',
}

const resultBox: JSX.CSSProperties = {
  'margin-top': '0.75rem',
  padding: '0.5rem 0.75rem',
  'border-radius': '6px',
  'font-size': '0.8rem',
  'font-family': 'monospace',
  'word-break': 'break-all',
  'white-space': 'pre-wrap',
}

const successBox: JSX.CSSProperties = {
  ...resultBox,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  color: '#166534',
}

const errorBox: JSX.CSSProperties = {
  ...resultBox,
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
}

const tabBar: JSX.CSSProperties = {
  display: 'flex',
  gap: '2px',
  'margin-bottom': '1rem',
  'border-bottom': '2px solid #e2e8f0',
}

const tabStyle: JSX.CSSProperties = {
  padding: '8px 16px',
  cursor: 'pointer',
  'font-size': '0.85rem',
  'font-weight': '500',
  border: 'none',
  background: 'none',
  color: '#64748b',
  'border-bottom': '2px solid transparent',
  'margin-bottom': '-2px',
  transition: 'all 0.15s',
}

const tabActiveStyle: JSX.CSSProperties = {
  ...tabStyle,
  color: '#2563eb',
  'border-bottom-color': '#2563eb',
  'font-weight': '600',
}

const muted: JSX.CSSProperties = {
  color: '#64748b',
  'font-size': '0.8rem',
  margin: '0.25rem 0 0',
}

// ─── Helpers ────────────────────────────────────────────────────

function bigIntReplacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value
}

function ResultDisplay(props: {
  data?: unknown
  error?: Error | null
  isPending?: boolean
}) {
  return (
    <>
      <Show when={props.isPending}>
        <div style={resultBox}>Loading…</div>
      </Show>
      <Show when={!props.isPending && props.error}>
        <div style={errorBox}>
          {(props.error as Error)?.message || String(props.error)}
        </div>
      </Show>
      <Show
        when={
          !props.isPending &&
          !props.error &&
          props.data !== undefined &&
          props.data !== null
        }
      >
        <div style={successBox}>
          {typeof props.data === 'object'
            ? JSON.stringify(props.data, bigIntReplacer, 2)
            : String(props.data)}
        </div>
      </Show>
    </>
  )
}

// ─── Tabs ───────────────────────────────────────────────────────

type Tab = 'basic' | 'spend' | 'signing' | 'contracts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'basic', label: 'Basic' },
  { id: 'spend', label: 'Spend' },
  { id: 'signing', label: 'Signing' },
  { id: 'contracts', label: 'Contracts' },
]

// ─── App ────────────────────────────────────────────────────────

export function App() {
  const [activeTab, setActiveTab] = createSignal<Tab>('basic')
  const activeAccount = useActiveAccount()

  return (
    <div
      style={{
        'font-family': 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
        'max-width': '680px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ 'font-size': '1.5rem', 'margin-bottom': '0.25rem' }}>
        @growae/reactive — Solid Playground
      </h1>
      <p style={{ ...muted, 'margin-bottom': '1.5rem', 'font-size': '0.9rem' }}>
        Aeternity blockchain primitives for Solid
      </p>

      <WalletCard />

      <Show when={activeAccount().isConnected}>
        <div style={tabBar}>
          <For each={TABS}>
            {(t) => (
              <button
                type="button"
                style={activeTab() === t.id ? tabActiveStyle : tabStyle}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            )}
          </For>
        </div>

        <Show when={activeTab() === 'basic'}>
          <BasicTab />
        </Show>
        <Show when={activeTab() === 'spend'}>
          <SpendTab />
        </Show>
        <Show when={activeTab() === 'signing'}>
          <SigningTab />
        </Show>
        <Show when={activeTab() === 'contracts'}>
          <ContractsTab />
        </Show>
      </Show>
    </div>
  )
}

// ─── Wallet Card ────────────────────────────────────────────────

function WalletCard() {
  const connectMutation = useConnect()
  const disconnectMutation = useDisconnect()
  const activeAccount = useActiveAccount()
  const switchMutation = useSwitchActiveAccount()
  const connectors = useConnectors()

  return (
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
            style={btnDanger}
            onClick={() => disconnectMutation.mutate({})}
          >
            Disconnect
          </button>
          <p
            style={{
              margin: '0.5rem 0 0',
              'font-size': '0.85rem',
              'word-break': 'break-all',
              color: '#0f172a',
            }}
          >
            <strong>Active:</strong> {activeAccount().address}
          </p>

          <Show
            when={
              activeAccount().addresses && activeAccount().addresses!.length > 1
            }
          >
            <p style={{ ...label, 'margin-top': '0.75rem' }}>All Accounts</p>
            <ul
              style={{
                margin: '0.25rem 0 0',
                padding: '0',
                'list-style': 'none',
              }}
            >
              <For each={activeAccount().addresses}>
                {(addr) => (
                  <li
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '0.5rem',
                      'margin-bottom': '0.3rem',
                    }}
                  >
                    <code
                      style={{
                        'font-size': '0.78rem',
                        flex: '1',
                        'word-break': 'break-all',
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
                            'font-size': '0.72rem',
                            padding: '2px 10px',
                          }}
                          onClick={() =>
                            switchMutation.mutate({ account: addr })
                          }
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
          </Show>
        </Show>
      </div>
    </div>
  )
}

// ─── Tab: Basic ─────────────────────────────────────────────────

function BasicTab() {
  const networkId = useNetworkId()
  const height = useHeight()
  const balance = useBalance()
  const switchNetworkMutation = useSwitchNetwork()
  const networks = useNetworks()

  return (
    <>
      <div style={card}>
        <strong>Chain Info</strong>
        <p
          style={{
            margin: '0.25rem 0 0',
            'font-size': '0.9rem',
            color: '#475569',
          }}
        >
          Network: {networkId() ?? '…'} &nbsp;|&nbsp; Height:{' '}
          {height.data?.toString() ?? '…'}
        </p>
      </div>

      <div style={card}>
        <strong>Balance</strong>
        <span style={badge}>active account</span>
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
              : balance.data != null
                ? `${balance.data} aettos (${toAe(balance.data)} AE)`
                : 'n/a'}
        </p>
      </div>

      <div style={card}>
        <strong>Switch Network</strong>
        <div
          style={{
            'margin-top': '0.5rem',
            display: 'flex',
            gap: '0.5rem',
            'flex-wrap': 'wrap',
          }}
        >
          <For each={networks()}>
            {(n) => (
              <button
                type="button"
                style={
                  n.id === networkId() ? { ...btnPrimary, opacity: '0.6' } : btn
                }
                disabled={
                  switchNetworkMutation.isPending || n.id === networkId()
                }
                onClick={() =>
                  switchNetworkMutation.mutate({ networkId: n.id })
                }
              >
                {n.name ?? n.id}
              </button>
            )}
          </For>
        </div>
        <Show when={switchNetworkMutation.isPending}>
          <p style={muted}>Switching…</p>
        </Show>
      </div>
    </>
  )
}

// ─── Tab: Spend ─────────────────────────────────────────────────

function SpendTab() {
  const activeAccount = useActiveAccount()
  const otherAccount = () =>
    activeAccount().addresses?.find((_, i) => i > 0) ?? ''

  const [recipient, setRecipient] = createSignal(otherAccount())
  const [amount, setAmount] = createSignal('1000000000000000000')
  const [payload, setPayload] = createSignal('')

  const spendMutation = useSpend()

  const handleSpend = () => {
    spendMutation.reset()
    spendMutation.mutateAsync({
      recipientId: recipient(),
      amount: amount(),
      payload: payload() || undefined,
    })
  }

  return (
    <div style={card}>
      <strong>Spend AE</strong>
      <p style={muted}>Transfer AE tokens to another account</p>

      <div style={label}>Recipient</div>
      <input
        style={input}
        value={recipient()}
        onInput={(e) => setRecipient(e.currentTarget.value)}
        placeholder="ak_..."
      />

      <div style={label}>Amount (aettos)</div>
      <input
        style={input}
        value={amount()}
        onInput={(e) => setAmount(e.currentTarget.value)}
        placeholder="1000000000000000000"
      />
      <p style={muted}>
        ≈ {(() => {
          try {
            return toAe(amount())
          } catch {
            return '—'
          }
        })()} AE
      </p>

      <div style={label}>Payload (optional)</div>
      <input
        style={input}
        value={payload()}
        onInput={(e) => setPayload(e.currentTarget.value)}
        placeholder="optional message"
      />

      <div style={{ 'margin-top': '1rem' }}>
        <button
          type="button"
          style={btnPrimary}
          disabled={spendMutation.isPending || !recipient() || !amount()}
          onClick={handleSpend}
        >
          {spendMutation.isPending ? 'Sending…' : 'Send'}
        </button>
      </div>

      <ResultDisplay
        data={spendMutation.data}
        error={spendMutation.error}
        isPending={false}
      />
    </div>
  )
}

// ─── Tab: Signing ───────────────────────────────────────────────

function SigningTab() {
  return (
    <>
      <SignMessageSection />
      <SignTypedDataSection />
    </>
  )
}

function SignMessageSection() {
  const activeAccount = useActiveAccount()
  const [message, setMessage] = createSignal('Hello, Aeternity!')

  const signMutation = useSignMessage()

  const verification = useVerifyMessage(() => ({
    message: message(),
    signature: signMutation.data?.signature ?? '',
    address: activeAccount().address ?? '',
    enabled: !!signMutation.data?.signature && !!activeAccount().address,
  }))

  const handleSign = () => {
    signMutation.reset()
    signMutation.mutateAsync({ message: message() })
  }

  return (
    <div style={card}>
      <strong>Sign Message</strong>
      <p style={muted}>Sign an arbitrary message and verify the signature</p>

      <div style={label}>Message</div>
      <input
        style={input}
        value={message()}
        onInput={(e) => setMessage(e.currentTarget.value)}
        placeholder="Enter message to sign"
      />

      <div style={{ 'margin-top': '0.75rem' }}>
        <button
          type="button"
          style={btnPrimary}
          disabled={signMutation.isPending || !message()}
          onClick={handleSign}
        >
          {signMutation.isPending ? 'Signing…' : 'Sign Message'}
        </button>
      </div>

      <ResultDisplay data={signMutation.data} error={signMutation.error} />

      <Show when={signMutation.data}>
        <div style={{ 'margin-top': '0.5rem' }}>
          <strong style={{ 'font-size': '0.85rem' }}>Verification</strong>
          <ResultDisplay
            data={
              verification.data != null
                ? { verified: verification.data }
                : undefined
            }
            error={verification.error}
            isPending={verification.isLoading}
          />
        </div>
      </Show>
    </div>
  )
}

function SignTypedDataSection() {
  const [domain, setDomain] = createSignal('{"name":"TestDapp","version":"1"}')
  const [aci, setAci] = createSignal('{"functions":[]}')
  const [data, setData] = createSignal('"hello world"')

  const signMutation = useSignTypedData()

  const handleSign = () => {
    signMutation.reset()
    try {
      signMutation.mutateAsync({
        domain: JSON.parse(domain()),
        aci: JSON.parse(aci()),
        data: JSON.parse(data()),
      })
    } catch (_err: any) {}
  }

  return (
    <div style={card}>
      <strong>Sign Typed Data</strong>
      <p style={muted}>EIP-712 style structured data signing</p>

      <div style={label}>Domain (JSON)</div>
      <textarea
        style={textarea}
        value={domain()}
        onInput={(e) => setDomain(e.currentTarget.value)}
      />

      <div style={label}>ACI (JSON)</div>
      <textarea
        style={textarea}
        value={aci()}
        onInput={(e) => setAci(e.currentTarget.value)}
      />

      <div style={label}>Data (JSON)</div>
      <textarea
        style={textarea}
        value={data()}
        onInput={(e) => setData(e.currentTarget.value)}
      />

      <div style={{ 'margin-top': '0.75rem' }}>
        <button
          type="button"
          style={btnPrimary}
          disabled={signMutation.isPending}
          onClick={handleSign}
        >
          {signMutation.isPending ? 'Signing…' : 'Sign Typed Data'}
        </button>
      </div>

      <ResultDisplay data={signMutation.data} error={signMutation.error} />
    </div>
  )
}

// ─── Tab: Contracts ─────────────────────────────────────────────

const DEFAULT_SOURCE = `contract Multiplier =
  record state = { factor : int }
  entrypoint init(f : int) : state = { factor = f }
  stateful entrypoint setFactor(f : int) : unit = put(state{ factor = f })
  entrypoint multiplyByFactor(x : int) : int = state.factor * x`

function ContractsTab() {
  const config = useConfig()

  const [sourceCode, setSourceCode] = createSignal(DEFAULT_SOURCE)
  const [compilerUrl, setCompilerUrl] = createSignal(
    'https://v8.compiler.aepps.com',
  )
  const [compiledResult, setCompiledResult] = createSignal<{
    bytecode: string
    aci: any
  } | null>(null)
  const [compileError, setCompileError] = createSignal<string | null>(null)
  const [compiling, setCompiling] = createSignal(false)

  const [contractAddress, setContractAddress] = createSignal('')
  const [initArg, setInitArg] = createSignal('5')

  const [callMethod, setCallMethod] = createSignal('setFactor')
  const [callArgs, setCallArgs] = createSignal('[7]')

  const [readMethod, setReadMethod] = createSignal('multiplyByFactor')
  const [readArgs, setReadArgs] = createSignal('[8]')

  const handleCompile = async () => {
    setCompiling(true)
    setCompileError(null)
    try {
      const { CompilerHttp } = await import('@aeternity/aepp-sdk')
      const compiler = new CompilerHttp(compilerUrl())
      const result = await compileContract(config(), {
        sourceCode: sourceCode(),
        onCompiler: compiler,
      })
      setCompiledResult(result as { bytecode: string; aci: any })
    } catch (err: any) {
      setCompileError(err.message || String(err))
    } finally {
      setCompiling(false)
    }
  }

  const deployMutation = useDeployContract()

  const handleDeploy = async () => {
    const compiled = compiledResult()
    if (!compiled) return
    deployMutation.reset()
    try {
      const result = await deployMutation.mutateAsync({
        bytecode: compiled.bytecode,
        aci: compiled.aci,
        initArgs: JSON.parse(`[${initArg()}]`),
      })
      setContractAddress(result.address)
    } catch {
      // error handled by mutation
    }
  }

  const callMutation = useCallContract()

  const handleCall = () => {
    const compiled = compiledResult()
    if (!contractAddress() || !compiled?.aci) return
    callMutation.reset()
    try {
      callMutation.mutateAsync({
        address: contractAddress(),
        aci: compiled.aci,
        method: callMethod(),
        args: JSON.parse(callArgs()),
      })
    } catch {
      // error handled by mutation
    }
  }

  const readResult = useReadContract(() => {
    let parsedArgs: any[] = []
    try {
      parsedArgs = JSON.parse(readArgs())
    } catch {
      // ignore
    }
    return {
      address: contractAddress() || ('_' as any),
      aci: compiledResult()?.aci ?? {},
      method: readMethod() || '_',
      args: parsedArgs,
      enabled: !!contractAddress() && !!compiledResult()?.aci && !!readMethod(),
    }
  })

  return (
    <>
      {/* Compile */}
      <div style={card}>
        <strong>Compile Contract</strong>
        <p style={muted}>Compile Sophia source code using a remote compiler</p>

        <div style={label}>Compiler URL</div>
        <input
          style={input}
          value={compilerUrl()}
          onInput={(e) => setCompilerUrl(e.currentTarget.value)}
        />

        <div style={label}>Source Code (Sophia)</div>
        <textarea
          style={{ ...textarea, 'min-height': '140px' }}
          value={sourceCode()}
          onInput={(e) => setSourceCode(e.currentTarget.value)}
        />

        <div style={{ 'margin-top': '0.75rem' }}>
          <button
            type="button"
            style={btnPrimary}
            disabled={compiling() || !sourceCode()}
            onClick={handleCompile}
          >
            {compiling() ? 'Compiling…' : 'Compile'}
          </button>
        </div>

        <Show when={compileError()}>
          <div style={errorBox}>{compileError()}</div>
        </Show>
        <Show when={compiledResult()}>
          <div style={successBox}>
            Compiled! Bytecode: {compiledResult()!.bytecode.slice(0, 30)}…
          </div>
        </Show>
      </div>

      {/* Deploy */}
      <div style={card}>
        <strong>Deploy Contract</strong>
        <span style={badge}>requires compile first</span>

        <div style={label}>Init Argument</div>
        <input
          style={input}
          value={initArg()}
          onInput={(e) => setInitArg(e.currentTarget.value)}
          placeholder="e.g. 5"
        />

        <div style={{ 'margin-top': '0.75rem' }}>
          <button
            type="button"
            style={btnPrimary}
            disabled={deployMutation.isPending || !compiledResult()}
            onClick={handleDeploy}
          >
            {deployMutation.isPending ? 'Deploying…' : 'Deploy'}
          </button>
        </div>

        <ResultDisplay
          data={deployMutation.data}
          error={deployMutation.error}
        />
        <Show when={contractAddress()}>
          <p style={{ ...muted, 'margin-top': '0.5rem' }}>
            <strong>Address:</strong> {contractAddress()}
          </p>
        </Show>
      </div>

      {/* Call (stateful) */}
      <div style={card}>
        <strong>Call Contract</strong>
        <span style={badge}>stateful</span>

        <div style={label}>Contract Address</div>
        <input
          style={input}
          value={contractAddress()}
          onInput={(e) => setContractAddress(e.currentTarget.value)}
          placeholder="ct_..."
        />

        <div style={label}>Method</div>
        <input
          style={input}
          value={callMethod()}
          onInput={(e) => setCallMethod(e.currentTarget.value)}
        />

        <div style={label}>Arguments (JSON array)</div>
        <input
          style={input}
          value={callArgs()}
          onInput={(e) => setCallArgs(e.currentTarget.value)}
          placeholder="[7]"
        />

        <div style={{ 'margin-top': '0.75rem' }}>
          <button
            type="button"
            style={btnPrimary}
            disabled={
              callMutation.isPending ||
              !contractAddress() ||
              !compiledResult()?.aci
            }
            onClick={handleCall}
          >
            {callMutation.isPending ? 'Calling…' : 'Call'}
          </button>
        </div>

        <ResultDisplay data={callMutation.data} error={callMutation.error} />
      </div>

      {/* Read (dry-run) */}
      <div style={card}>
        <strong>Read Contract</strong>
        <span style={badge}>static / dry-run</span>

        <div style={label}>Method</div>
        <input
          style={input}
          value={readMethod()}
          onInput={(e) => setReadMethod(e.currentTarget.value)}
        />

        <div style={label}>Arguments (JSON array)</div>
        <input
          style={input}
          value={readArgs()}
          onInput={(e) => setReadArgs(e.currentTarget.value)}
          placeholder="[8]"
        />

        <ResultDisplay
          data={readResult.data}
          error={readResult.error}
          isPending={readResult.isLoading}
        />
      </div>
    </>
  )
}
