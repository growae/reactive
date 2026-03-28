<template>
  <div :style="layout">
    <h1 style="font-size: 1.5rem; margin-bottom: 0.25rem">
      @growae/reactive — Vue Playground
    </h1>
    <p :style="{ ...muted, marginBottom: '1.5rem', fontSize: '0.9rem' }">
      Aeternity blockchain composables for Vue
    </p>

    <!-- Wallet -->
    <div :style="card">
      <strong>Wallet</strong>
      <div style="margin-top: 0.75rem">
        <template v-if="!activeAccount.isConnected">
          <button
            v-for="c in connectors"
            :key="c.id"
            :style="btnPrimary"
            :disabled="isConnecting"
            @click="connect({ connector: c })"
          >
            {{ isConnecting ? 'Connecting…' : `Connect ${c.name}` }}
          </button>
        </template>
        <template v-else>
          <button :style="btnDanger" @click="disconnect()">Disconnect</button>
          <p style="margin: 0.5rem 0 0; font-size: 0.85rem; word-break: break-all; color: #0f172a">
            <strong>Active:</strong> {{ activeAccount.address }}
          </p>

          <template v-if="activeAccount.addresses && activeAccount.addresses.length > 1">
            <p :style="{ ...labelStyle, marginTop: '0.75rem' }">All Accounts</p>
            <ul style="margin: 0.25rem 0 0; padding: 0; list-style: none">
              <li
                v-for="addr in activeAccount.addresses"
                :key="addr"
                style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem"
              >
                <code style="font-size: 0.78rem; flex: 1; word-break: break-all">
                  {{ addr.slice(0, 14) }}…{{ addr.slice(-6) }}
                </code>
                <span v-if="addr === activeAccount.address" :style="activeBadge">active</span>
                <button
                  v-else
                  :style="{ ...btn, fontSize: '0.72rem', padding: '2px 10px' }"
                  @click="switchActiveAccount({ account: addr })"
                >
                  Switch
                </button>
              </li>
            </ul>
          </template>
        </template>
      </div>
    </div>

    <!-- Tabs -->
    <template v-if="activeAccount.isConnected">
      <div :style="tabBar">
        <button
          v-for="t in TABS"
          :key="t.id"
          type="button"
          :style="activeTab === t.id ? tabActive : tabStyle"
          @click="activeTab = t.id"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Basic Tab -->
      <template v-if="activeTab === 'basic'">
        <div :style="card">
          <strong>Chain Info</strong>
          <p style="margin: 0.25rem 0 0; font-size: 0.9rem; color: #475569">
            Network: {{ networkId ?? '…' }} &nbsp;|&nbsp; Height: {{ height.data?.toString() ?? '…' }}
          </p>
        </div>

        <div :style="card">
          <strong>Balance</strong>
          <span :style="badge">active account</span>
          <p style="margin: 0.5rem 0 0; font-size: 0.9rem; color: #475569">
            {{ balance.isLoading
              ? '…'
              : balance.error
                ? 'error fetching'
                : balance.data != null
                  ? `${balance.data} aettos (${toAe(balance.data)} AE)`
                  : 'n/a' }}
          </p>
        </div>

        <div :style="card">
          <strong>Switch Network</strong>
          <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap">
            <button
              v-for="n in networks"
              :key="n.id"
              type="button"
              :style="n.id === networkId ? { ...btnPrimary, opacity: 0.6 } : btn"
              :disabled="switching || n.id === networkId"
              @click="switchNetwork({ networkId: n.id })"
            >
              {{ n.name ?? n.id }}
            </button>
          </div>
          <p v-if="switching" :style="muted">Switching…</p>
        </div>
      </template>

      <!-- Spend Tab -->
      <template v-if="activeTab === 'spend'">
        <div :style="card">
          <strong>Spend AE</strong>
          <p :style="muted">Transfer AE tokens to another account</p>

          <div :style="labelStyle">Recipient</div>
          <input :style="inputStyle" v-model="recipient" placeholder="ak_..." />

          <div :style="labelStyle">Amount (aettos)</div>
          <input :style="inputStyle" v-model="amount" placeholder="1000000000000000000" />
          <p :style="muted">≈ {{ amountInAe }} AE</p>

          <div :style="labelStyle">Payload (optional)</div>
          <input :style="inputStyle" v-model="payload" placeholder="optional message" />

          <div style="margin-top: 1rem">
            <button
              type="button"
              :style="btnPrimary"
              :disabled="spendMutation.isPending || !recipient || !amount"
              @click="handleSpend"
            >
              {{ spendMutation.isPending ? 'Sending…' : 'Send' }}
            </button>
          </div>

          <div v-if="spendMutation.error" :style="errorBox">{{ spendMutation.error.message || String(spendMutation.error) }}</div>
          <div v-else-if="spendMutation.data != null" :style="successBox">{{ formatData(spendMutation.data) }}</div>
        </div>
      </template>

      <!-- Signing Tab -->
      <template v-if="activeTab === 'signing'">
        <!-- Sign Message -->
        <div :style="card">
          <strong>Sign Message</strong>
          <p :style="muted">Sign an arbitrary message and verify the signature</p>

          <div :style="labelStyle">Message</div>
          <input :style="inputStyle" v-model="signMsg" placeholder="Enter message to sign" />

          <div style="margin-top: 0.75rem">
            <button
              type="button"
              :style="btnPrimary"
              :disabled="signMsgMutation.isPending || !signMsg"
              @click="handleSignMessage"
            >
              {{ signMsgMutation.isPending ? 'Signing…' : 'Sign Message' }}
            </button>
          </div>

          <div v-if="signMsgMutation.error" :style="errorBox">{{ signMsgMutation.error.message || String(signMsgMutation.error) }}</div>
          <div v-else-if="signMsgMutation.data != null" :style="successBox">{{ formatData(signMsgMutation.data) }}</div>

          <div v-if="signMsgMutation.data" style="margin-top: 0.5rem">
            <strong style="font-size: 0.85rem">Verification</strong>
            <div v-if="verification.isLoading" :style="resultBox">Loading…</div>
            <div v-else-if="verification.error" :style="errorBox">{{ verification.error.message || String(verification.error) }}</div>
            <div v-else-if="verification.data != null" :style="successBox">{{ formatData({ verified: verification.data }) }}</div>
          </div>
        </div>

        <!-- Sign Typed Data -->
        <div :style="card">
          <strong>Sign Typed Data</strong>
          <p :style="muted">EIP-712 style structured data signing</p>

          <div :style="labelStyle">Domain (JSON)</div>
          <textarea :style="textareaStyle" v-model="typedDomain" />

          <div :style="labelStyle">ACI (JSON)</div>
          <textarea :style="textareaStyle" v-model="typedAci" />

          <div :style="labelStyle">Data (JSON)</div>
          <textarea :style="textareaStyle" v-model="typedData" />

          <div style="margin-top: 0.75rem">
            <button
              type="button"
              :style="btnPrimary"
              :disabled="signTypedMutation.isPending"
              @click="handleSignTypedData"
            >
              {{ signTypedMutation.isPending ? 'Signing…' : 'Sign Typed Data' }}
            </button>
          </div>

          <div v-if="signTypedMutation.error" :style="errorBox">{{ signTypedMutation.error.message || String(signTypedMutation.error) }}</div>
          <div v-else-if="signTypedMutation.data != null" :style="successBox">{{ formatData(signTypedMutation.data) }}</div>
        </div>
      </template>

      <!-- Contracts Tab -->
      <template v-if="activeTab === 'contracts'">
        <!-- Compile -->
        <div :style="card">
          <strong>Compile Contract</strong>
          <p :style="muted">Compile Sophia source code using a remote compiler</p>

          <div :style="labelStyle">Compiler URL</div>
          <input :style="inputStyle" v-model="compilerUrl" />

          <div :style="labelStyle">Source Code (Sophia)</div>
          <textarea :style="{ ...textareaStyle, minHeight: '140px' }" v-model="sourceCode" />

          <div style="margin-top: 0.75rem">
            <button
              type="button"
              :style="btnPrimary"
              :disabled="compiling || !sourceCode"
              @click="handleCompile"
            >
              {{ compiling ? 'Compiling…' : 'Compile' }}
            </button>
          </div>

          <div v-if="compileError" :style="errorBox">{{ compileError }}</div>
          <div v-if="compiledResult" :style="successBox">
            Compiled! Bytecode: {{ compiledResult.bytecode.slice(0, 30) }}…
          </div>
        </div>

        <!-- Deploy -->
        <div :style="card">
          <strong>Deploy Contract</strong>
          <span :style="badge">requires compile first</span>

          <div :style="labelStyle">Init Argument</div>
          <input :style="inputStyle" v-model="initArg" placeholder="e.g. 5" />

          <div style="margin-top: 0.75rem">
            <button
              type="button"
              :style="btnPrimary"
              :disabled="deployMutation.isPending || !compiledResult"
              @click="handleDeploy"
            >
              {{ deployMutation.isPending ? 'Deploying…' : 'Deploy' }}
            </button>
          </div>

          <div v-if="deployMutation.error" :style="errorBox">{{ deployMutation.error.message || String(deployMutation.error) }}</div>
          <div v-else-if="deployMutation.data != null" :style="successBox">{{ formatData(deployMutation.data) }}</div>
          <p v-if="contractAddress" :style="{ ...muted, marginTop: '0.5rem' }">
            <strong>Address:</strong> {{ contractAddress }}
          </p>
        </div>

        <!-- Call (stateful) -->
        <div :style="card">
          <strong>Call Contract</strong>
          <span :style="badge">stateful</span>

          <div :style="labelStyle">Contract Address</div>
          <input :style="inputStyle" v-model="contractAddress" placeholder="ct_..." />

          <div :style="labelStyle">Method</div>
          <input :style="inputStyle" v-model="callMethod" />

          <div :style="labelStyle">Arguments (JSON array)</div>
          <input :style="inputStyle" v-model="callArgs" placeholder="[7]" />

          <div style="margin-top: 0.75rem">
            <button
              type="button"
              :style="btnPrimary"
              :disabled="callMutation.isPending || !contractAddress || !compiledResult?.aci"
              @click="handleCall"
            >
              {{ callMutation.isPending ? 'Calling…' : 'Call' }}
            </button>
          </div>

          <div v-if="callMutation.error" :style="errorBox">{{ callMutation.error.message || String(callMutation.error) }}</div>
          <div v-else-if="callMutation.data != null" :style="successBox">{{ formatData(callMutation.data) }}</div>
        </div>

        <!-- Read (dry-run) -->
        <div :style="card">
          <strong>Read Contract</strong>
          <span :style="badge">static / dry-run</span>

          <div :style="labelStyle">Method</div>
          <input :style="inputStyle" v-model="readMethod" />

          <div :style="labelStyle">Arguments (JSON array)</div>
          <input :style="inputStyle" v-model="readArgs" placeholder="[8]" />

          <div v-if="readResult.isLoading" :style="resultBox">Loading…</div>
          <div v-else-if="readResult.error" :style="errorBox">{{ readResult.error.message || String(readResult.error) }}</div>
          <div v-else-if="readResult.data != null" :style="successBox">{{ formatData(readResult.data) }}</div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
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
  useReadContract,
  useSignMessage,
  useSignTypedData,
  useSpend,
  useSwitchActiveAccount,
  useSwitchNetwork,
  useVerifyMessage,
} from '@growae/reactive-vue'
import { computed, ref } from 'vue'

// ─── Composables ─────────────────────────────────────────────

const config = useConfig()
const networkId = useNetworkId()
const height = useHeight()
const balance = useBalance()
const { connect, connectors, isPending: isConnecting } = useConnect()
const { disconnect } = useDisconnect()
const activeAccount = useActiveAccount()
const { switchActiveAccount } = useSwitchActiveAccount()
const { switchNetwork, networks, isPending: switching } = useSwitchNetwork()

const spendMutation = useSpend()
const signMsgMutation = useSignMessage()
const signTypedMutation = useSignTypedData()
const deployMutation = useDeployContract()
const callMutation = useCallContract()

// ─── Tabs ────────────────────────────────────────────────────

type Tab = 'basic' | 'spend' | 'signing' | 'contracts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'basic', label: 'Basic' },
  { id: 'spend', label: 'Spend' },
  { id: 'signing', label: 'Signing' },
  { id: 'contracts', label: 'Contracts' },
]

const activeTab = ref<Tab>('basic')

// ─── Spend State ─────────────────────────────────────────────

const recipient = ref(
  activeAccount.addresses?.find((_a: string, i: number) => i > 0) ?? '',
)
const amount = ref('1000000000000000000')
const payload = ref('')

const amountInAe = computed(() => {
  try {
    return toAe(amount.value)
  } catch {
    return '—'
  }
})

function handleSpend() {
  spendMutation.reset()
  spendMutation.spendAsync({
    recipientId: recipient.value,
    amount: amount.value,
    payload: payload.value || undefined,
  })
}

// ─── Sign Message State ──────────────────────────────────────

const signMsg = ref('Hello, Aeternity!')

function handleSignMessage() {
  signMsgMutation.reset()
  signMsgMutation.signMessageAsync({ message: signMsg.value })
}

const verification = useVerifyMessage(
  computed(() => ({
    message: signMsg.value,
    signature: signMsgMutation.data?.signature ?? '',
    address: activeAccount.address ?? '',
    enabled: !!signMsgMutation.data?.signature && !!activeAccount.address,
  })),
)

// ─── Sign Typed Data State ───────────────────────────────────

const typedDomain = ref('{"name":"TestDapp","version":"1"}')
const typedAci = ref('{"functions":[]}')
const typedData = ref('"hello world"')

function handleSignTypedData() {
  signTypedMutation.reset()
  try {
    signTypedMutation.signTypedDataAsync({
      domain: JSON.parse(typedDomain.value),
      aci: JSON.parse(typedAci.value),
      data: JSON.parse(typedData.value),
    })
  } catch (err: any) {}
}

// ─── Contracts State ─────────────────────────────────────────

const DEFAULT_SOURCE = `contract Multiplier =
  record state = { factor : int }
  entrypoint init(f : int) : state = { factor = f }
  stateful entrypoint setFactor(f : int) : unit = put(state{ factor = f })
  entrypoint multiplyByFactor(x : int) : int = state.factor * x`

const sourceCode = ref(DEFAULT_SOURCE)
const compilerUrl = ref('https://v8.compiler.aepps.com')
const compiledResult = ref<{ bytecode: string; aci: any } | null>(null)
const compileError = ref<string | null>(null)
const compiling = ref(false)

const contractAddress = ref('')
const initArg = ref('5')
const callMethod = ref('setFactor')
const callArgs = ref('[7]')
const readMethod = ref('multiplyByFactor')
const readArgs = ref('[8]')

async function handleCompile() {
  compiling.value = true
  compileError.value = null
  try {
    const { CompilerHttp } = await import('@aeternity/aepp-sdk')
    const compiler = new CompilerHttp(compilerUrl.value)
    const result = await compileContract(config, {
      sourceCode: sourceCode.value,
      onCompiler: compiler,
    })
    compiledResult.value = result as { bytecode: string; aci: any }
  } catch (err: any) {
    compileError.value = err.message || String(err)
  } finally {
    compiling.value = false
  }
}

async function handleDeploy() {
  if (!compiledResult.value) return
  deployMutation.reset()
  try {
    const result = await deployMutation.deployContractAsync({
      bytecode: compiledResult.value.bytecode,
      aci: compiledResult.value.aci,
      initArgs: JSON.parse(`[${initArg.value}]`),
    })
    contractAddress.value = result.address
  } catch {
    // error handled by hook
  }
}

function handleCall() {
  if (!contractAddress.value || !compiledResult.value?.aci) return
  callMutation.reset()
  try {
    callMutation.callContractAsync({
      address: contractAddress.value,
      aci: compiledResult.value.aci,
      method: callMethod.value,
      args: JSON.parse(callArgs.value),
    })
  } catch {
    // error handled by hook
  }
}

const parsedReadArgs = computed(() => {
  try {
    return JSON.parse(readArgs.value)
  } catch {
    return []
  }
})

const readResult = useReadContract(
  computed(() => ({
    address: contractAddress.value || ('_' as any),
    aci: compiledResult.value?.aci ?? {},
    method: readMethod.value || '_',
    args: parsedReadArgs.value,
    enabled:
      !!contractAddress.value &&
      !!compiledResult.value?.aci &&
      !!readMethod.value,
  })),
)

// ─── Helpers ─────────────────────────────────────────────────

function bigIntReplacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value
}

function formatData(data: unknown): string {
  if (typeof data === 'object') return JSON.stringify(data, bigIntReplacer, 2)
  return String(data)
}

// ─── Styles ──────────────────────────────────────────────────

const layout = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '2rem',
  maxWidth: '680px',
  margin: '0 auto',
}

const card = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '1rem 1.5rem',
  marginBottom: '1rem',
  background: '#f8fafc',
}

const badge = {
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: '99px',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: '#dbeafe',
  color: '#1d4ed8',
  marginLeft: '0.5rem',
}

const activeBadge = {
  ...badge,
  background: '#dcfce7',
  color: '#15803d',
}

const btn = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  marginRight: '0.5rem',
  fontSize: '0.85rem',
}

const btnPrimary = {
  ...btn,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
}

const btnDanger = {
  ...btn,
  background: '#dc2626',
  color: '#fff',
  border: 'none',
}

const inputStyle = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '0.85rem',
  fontFamily: 'monospace',
  boxSizing: 'border-box' as const,
}

const textareaStyle = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical' as const,
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#475569',
  marginBottom: '4px',
  marginTop: '0.75rem',
}

const resultBox = {
  marginTop: '0.75rem',
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.8rem',
  fontFamily: 'monospace',
  wordBreak: 'break-all' as const,
  whiteSpace: 'pre-wrap' as const,
}

const successBox = {
  ...resultBox,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  color: '#166534',
}

const errorBox = {
  ...resultBox,
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
}

const tabBar = {
  display: 'flex',
  gap: '2px',
  marginBottom: '1rem',
  borderBottom: '2px solid #e2e8f0',
}

const tabStyle = {
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

const tabActive = {
  ...tabStyle,
  color: '#2563eb',
  borderBottomColor: '#2563eb',
  fontWeight: 600,
}

const muted = {
  color: '#64748b',
  fontSize: '0.8rem',
  margin: '0.25rem 0 0',
}
</script>
