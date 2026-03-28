import { compileContract } from '@growae/reactive'
import {
  toAe,
  useActiveAccount,
  useBalance,
  useCallContract,
  useConfig,
  useConnect,
  useDeployContract,
  useDisconnect,
  useHeight,
  useNetworkId,
  usePayForTransaction,
  useReadContract,
  useSignMessage,
  useSignTransaction,
  useSignTypedData,
  useSpend,
  useSwitchActiveAccount,
  useSwitchNetwork,
  useVerifyMessage,
} from '@growae/reactive-react'
import { useState } from 'react'

// ─── Styles ─────────────────────────────────────────────────────

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

const btnDanger: React.CSSProperties = {
  ...btn,
  background: '#dc2626',
  color: '#fff',
  border: 'none',
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '0.85rem',
  fontFamily: 'monospace',
  boxSizing: 'border-box',
}

const textarea: React.CSSProperties = {
  ...input,
  minHeight: '80px',
  resize: 'vertical',
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#475569',
  marginBottom: '4px',
  marginTop: '0.75rem',
}

const resultBox: React.CSSProperties = {
  marginTop: '0.75rem',
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.8rem',
  fontFamily: 'monospace',
  wordBreak: 'break-all',
  whiteSpace: 'pre-wrap',
}

const successBox: React.CSSProperties = {
  ...resultBox,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  color: '#166534',
}

const errorBox: React.CSSProperties = {
  ...resultBox,
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
}

const tabBar: React.CSSProperties = {
  display: 'flex',
  gap: '2px',
  marginBottom: '1rem',
  borderBottom: '2px solid #e2e8f0',
}

const tab: React.CSSProperties = {
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: 500,
  border: 'none',
  background: 'none',
  color: '#64748b',
  borderBottom: '2px solid transparent',
  marginBottom: '-2px',
  transition: 'all 0.15s',
}

const tabActive: React.CSSProperties = {
  ...tab,
  color: '#2563eb',
  borderBottomColor: '#2563eb',
  fontWeight: 600,
}

const muted: React.CSSProperties = {
  color: '#64748b',
  fontSize: '0.8rem',
  margin: '0.25rem 0 0',
}

// ─── Helpers ────────────────────────────────────────────────────

function ResultDisplay({
  data,
  error,
  isPending,
}: {
  data?: unknown
  error?: Error | null
  isPending?: boolean
}) {
  if (isPending) return <div style={resultBox}>Loading…</div>
  if (error) return <div style={errorBox}>{error.message || String(error)}</div>
  if (data !== undefined && data !== null)
    return (
      <div style={successBox}>
        {typeof data === 'object'
          ? JSON.stringify(data, bigIntReplacer, 2)
          : String(data)}
      </div>
    )
  return null
}

function bigIntReplacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value
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
  const [activeTab, setActiveTab] = useState<Tab>('basic')
  const { isConnected } = useActiveAccount()

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
        maxWidth: '680px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
        @growae/reactive — React Playground
      </h1>
      <p style={{ ...muted, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Aeternity blockchain hooks for React
      </p>

      <WalletCard />

      {isConnected && (
        <>
          <div style={tabBar}>
            {TABS.map((t) => (
              <button
                type="button"
                key={t.id}
                style={activeTab === t.id ? tabActive : tab}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'basic' && <BasicTab />}
          {activeTab === 'spend' && <SpendTab />}
          {activeTab === 'signing' && <SigningTab />}
          {activeTab === 'contracts' && <ContractsTab />}
        </>
      )}
    </div>
  )
}

// ─── Wallet Card ────────────────────────────────────────────────

function WalletCard() {
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { address, addresses, isConnected } = useActiveAccount()
  const { switchActiveAccount } = useSwitchActiveAccount()

  return (
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
          <>
            <button
              type="button"
              style={btnDanger}
              onClick={() => disconnect()}
            >
              Disconnect
            </button>
            <p
              style={{
                margin: '0.5rem 0 0',
                fontSize: '0.85rem',
                wordBreak: 'break-all',
                color: '#0f172a',
              }}
            >
              <strong>Active:</strong> {address}
            </p>

            {addresses && addresses.length > 1 && (
              <>
                <p style={{ ...label, marginTop: '0.75rem' }}>All Accounts</p>
                <ul
                  style={{
                    margin: '0.25rem 0 0',
                    padding: 0,
                    listStyle: 'none',
                  }}
                >
                  {addresses.map((addr) => (
                    <li
                      key={addr}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.3rem',
                      }}
                    >
                      <code
                        style={{
                          fontSize: '0.78rem',
                          flex: 1,
                          wordBreak: 'break-all',
                        }}
                      >
                        {addr.slice(0, 14)}…{addr.slice(-6)}
                      </code>
                      {addr === address ? (
                        <span style={activeBadge}>active</span>
                      ) : (
                        <button
                          type="button"
                          style={{
                            ...btn,
                            fontSize: '0.72rem',
                            padding: '2px 10px',
                          }}
                          onClick={() => switchActiveAccount({ account: addr })}
                        >
                          Switch
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Basic ─────────────────────────────────────────────────

function BasicTab() {
  const networkId = useNetworkId()
  const height = useHeight()
  const balance = useBalance()
  const { switchNetwork, networks, isPending: switching } = useSwitchNetwork()

  return (
    <>
      <div style={card}>
        <strong>Chain Info</strong>
        <p
          style={{
            margin: '0.25rem 0 0',
            fontSize: '0.9rem',
            color: '#475569',
          }}
        >
          Network: {networkId ?? '…'} &nbsp;|&nbsp; Height:{' '}
          {height.data?.toString() ?? '…'}
        </p>
      </div>

      <div style={card}>
        <strong>Balance</strong>
        <span style={badge}>active account</span>
        <p
          style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#475569' }}
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
            marginTop: '0.5rem',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {networks.map((n) => (
            <button
              type="button"
              key={n.id}
              style={n.id === networkId ? { ...btnPrimary, opacity: 0.6 } : btn}
              disabled={switching || n.id === networkId}
              onClick={() => switchNetwork({ networkId: n.id })}
            >
              {n.name ?? n.id}
            </button>
          ))}
        </div>
        {switching && <p style={muted}>Switching…</p>}
      </div>
    </>
  )
}

// ─── Tab: Spend ─────────────────────────────────────────────────

function SpendTab() {
  const { addresses } = useActiveAccount()
  const otherAccount = addresses?.find((_a, i) => i > 0) ?? ''

  const [recipient, setRecipient] = useState(otherAccount)
  const [amount, setAmount] = useState('1000000000000000000')
  const [payload, setPayload] = useState('')

  const {
    spendAsync,
    isPending,
    data: spendResult,
    error: spendError,
    reset,
  } = useSpend()

  const handleSpend = () => {
    reset()
    spendAsync({
      recipientId: recipient,
      amount,
      payload: payload || undefined,
    })
  }

  return (
    <div style={card}>
      <strong>Spend AE</strong>
      <p style={muted}>Transfer AE tokens to another account</p>

      <div style={label}>Recipient</div>
      <input
        style={input}
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="ak_..."
      />

      <div style={label}>Amount (aettos)</div>
      <input
        style={input}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="1000000000000000000"
      />
      <p style={muted}>
        ≈ {(() => {
          try {
            return toAe(amount)
          } catch {
            return '—'
          }
        })()} AE
      </p>

      <div style={label}>Payload (optional)</div>
      <input
        style={input}
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        placeholder="optional message"
      />

      <div style={{ marginTop: '1rem' }}>
        <button
          type="button"
          style={btnPrimary}
          disabled={isPending || !recipient || !amount}
          onClick={handleSpend}
        >
          {isPending ? 'Sending…' : 'Send'}
        </button>
      </div>

      <ResultDisplay data={spendResult} error={spendError} isPending={false} />
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
  const { address } = useActiveAccount()
  const [message, setMessage] = useState('Hello, Aeternity!')

  const {
    signMessageAsync,
    isPending: signing,
    data: signed,
    error: signError,
    reset: resetSign,
  } = useSignMessage()

  const verification = useVerifyMessage({
    message,
    signature: signed?.signature ?? '',
    address: address ?? '',
    enabled: !!signed?.signature && !!address,
  })

  const handleSign = () => {
    resetSign()
    signMessageAsync({ message })
  }

  return (
    <div style={card}>
      <strong>Sign Message</strong>
      <p style={muted}>Sign an arbitrary message and verify the signature</p>

      <div style={label}>Message</div>
      <input
        style={input}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter message to sign"
      />

      <div style={{ marginTop: '0.75rem' }}>
        <button
          type="button"
          style={btnPrimary}
          disabled={signing || !message}
          onClick={handleSign}
        >
          {signing ? 'Signing…' : 'Sign Message'}
        </button>
      </div>

      <ResultDisplay data={signed} error={signError} />

      {signed && (
        <div style={{ marginTop: '0.5rem' }}>
          <strong style={{ fontSize: '0.85rem' }}>Verification</strong>
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
      )}
    </div>
  )
}

function SignTypedDataSection() {
  const [domain, setDomain] = useState('{"name":"TestDapp","version":"1"}')
  const [aci, setAci] = useState('{"functions":[]}')
  const [data, setData] = useState('"hello world"')

  const {
    signTypedDataAsync,
    isPending: signing,
    data: signed,
    error: signError,
    reset,
  } = useSignTypedData()

  const handleSign = () => {
    reset()
    try {
      signTypedDataAsync({
        domain: JSON.parse(domain),
        aci: JSON.parse(aci),
        data: JSON.parse(data),
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
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
      />

      <div style={label}>ACI (JSON)</div>
      <textarea
        style={textarea}
        value={aci}
        onChange={(e) => setAci(e.target.value)}
      />

      <div style={label}>Data (JSON)</div>
      <textarea
        style={textarea}
        value={data}
        onChange={(e) => setData(e.target.value)}
      />

      <div style={{ marginTop: '0.75rem' }}>
        <button
          type="button"
          style={btnPrimary}
          disabled={signing}
          onClick={handleSign}
        >
          {signing ? 'Signing…' : 'Sign Typed Data'}
        </button>
      </div>

      <ResultDisplay data={signed} error={signError} />
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

  const [sourceCode, setSourceCode] = useState(DEFAULT_SOURCE)
  const [compilerUrl, setCompilerUrl] = useState(
    'https://v8.compiler.aepps.com',
  )
  const [compiledResult, setCompiledResult] = useState<{
    bytecode: string
    aci: any
  } | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [compiling, setCompiling] = useState(false)

  const [contractAddress, setContractAddress] = useState('')
  const [initArg, setInitArg] = useState('5')

  const [callMethod, setCallMethod] = useState('setFactor')
  const [callArgs, setCallArgs] = useState('[7]')

  const [readMethod, setReadMethod] = useState('multiplyByFactor')
  const [readArgs, setReadArgs] = useState('[8]')

  const handleCompile = async () => {
    setCompiling(true)
    setCompileError(null)
    try {
      const { CompilerHttp } = await import('@aeternity/aepp-sdk')
      const compiler = new CompilerHttp(compilerUrl)
      const result = await compileContract(config, {
        sourceCode,
        onCompiler: compiler,
      })
      setCompiledResult(result as { bytecode: string; aci: any })
    } catch (err: any) {
      setCompileError(err.message || String(err))
    } finally {
      setCompiling(false)
    }
  }

  const {
    deployContractAsync,
    isPending: deploying,
    data: deployResult,
    error: deployError,
    reset: resetDeploy,
  } = useDeployContract()

  const handleDeploy = async () => {
    if (!compiledResult) return
    resetDeploy()
    try {
      const result = await deployContractAsync({
        bytecode: compiledResult.bytecode,
        aci: compiledResult.aci,
        initArgs: JSON.parse(`[${initArg}]`),
      })
      setContractAddress(result.address)
    } catch {
      // error handled by hook
    }
  }

  const {
    callContractAsync,
    isPending: calling,
    data: callResult,
    error: callError,
    reset: resetCall,
  } = useCallContract()

  const handleCall = () => {
    if (!contractAddress || !compiledResult?.aci) return
    resetCall()
    try {
      callContractAsync({
        address: contractAddress,
        aci: compiledResult.aci,
        method: callMethod,
        args: JSON.parse(callArgs),
      })
    } catch {
      // error handled by hook
    }
  }

  let parsedReadArgs: any[] = []
  try {
    parsedReadArgs = JSON.parse(readArgs)
  } catch {
    // ignore parse errors
  }

  const readResult = useReadContract({
    address: contractAddress || ('_' as any),
    aci: compiledResult?.aci ?? {},
    method: readMethod || '_',
    args: parsedReadArgs,
    enabled: !!contractAddress && !!compiledResult?.aci && !!readMethod,
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
          value={compilerUrl}
          onChange={(e) => setCompilerUrl(e.target.value)}
        />

        <div style={label}>Source Code (Sophia)</div>
        <textarea
          style={{ ...textarea, minHeight: '140px' }}
          value={sourceCode}
          onChange={(e) => setSourceCode(e.target.value)}
        />

        <div style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            style={btnPrimary}
            disabled={compiling || !sourceCode}
            onClick={handleCompile}
          >
            {compiling ? 'Compiling…' : 'Compile'}
          </button>
        </div>

        {compileError && <div style={errorBox}>{compileError}</div>}
        {compiledResult && (
          <div style={successBox}>
            Compiled! Bytecode: {compiledResult.bytecode.slice(0, 30)}…
          </div>
        )}
      </div>

      {/* Deploy */}
      <div style={card}>
        <strong>Deploy Contract</strong>
        <span style={badge}>requires compile first</span>

        <div style={label}>Init Argument</div>
        <input
          style={input}
          value={initArg}
          onChange={(e) => setInitArg(e.target.value)}
          placeholder="e.g. 5"
        />

        <div style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            style={btnPrimary}
            disabled={deploying || !compiledResult}
            onClick={handleDeploy}
          >
            {deploying ? 'Deploying…' : 'Deploy'}
          </button>
        </div>

        <ResultDisplay data={deployResult} error={deployError} />
        {contractAddress && (
          <p style={{ ...muted, marginTop: '0.5rem' }}>
            <strong>Address:</strong> {contractAddress}
          </p>
        )}
      </div>

      {/* Call (stateful) */}
      <div style={card}>
        <strong>Call Contract</strong>
        <span style={badge}>stateful</span>

        <div style={label}>Contract Address</div>
        <input
          style={input}
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="ct_..."
        />

        <div style={label}>Method</div>
        <input
          style={input}
          value={callMethod}
          onChange={(e) => setCallMethod(e.target.value)}
        />

        <div style={label}>Arguments (JSON array)</div>
        <input
          style={input}
          value={callArgs}
          onChange={(e) => setCallArgs(e.target.value)}
          placeholder="[7]"
        />

        <div style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            style={btnPrimary}
            disabled={calling || !contractAddress || !compiledResult?.aci}
            onClick={handleCall}
          >
            {calling ? 'Calling…' : 'Call'}
          </button>
        </div>

        <ResultDisplay data={callResult} error={callError} />
      </div>

      {/* Read (dry-run) */}
      <div style={card}>
        <strong>Read Contract</strong>
        <span style={badge}>static / dry-run</span>

        <div style={label}>Method</div>
        <input
          style={input}
          value={readMethod}
          onChange={(e) => setReadMethod(e.target.value)}
        />

        <div style={label}>Arguments (JSON array)</div>
        <input
          style={input}
          value={readArgs}
          onChange={(e) => setReadArgs(e.target.value)}
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
