<template>
  <div style="font-family: system-ui; padding: 2rem; max-width: 600px; margin: 0 auto">
    <h1 style="font-size: 1.5rem; margin-bottom: 0.25rem">
      @growae/reactive — Vue Playground
    </h1>
    <p style="color: #64748b; margin-top: 0; margin-bottom: 1.5rem; font-size: 0.9rem">
      Aeternity blockchain composables for Vue
    </p>

    <!-- Network -->
    <div :style="card">
      <strong>Network</strong>
      <p style="margin: 0.25rem 0 0; font-size: 0.9rem; color: #475569">
        ID: {{ networkId.data ?? '…' }}&nbsp;&nbsp;|&nbsp;&nbsp;Height: {{ height.data?.toString() ?? '…' }}
      </p>
    </div>

    <!-- Connect -->
    <div :style="card">
      <strong>Wallet</strong>
      <div style="margin-top: 0.75rem">
        <template v-if="!activeAccount.isConnected">
          <button
            v-for="c in connectors"
            :key="c.id"
            :style="btnPrimary"
            :disabled="isPending"
            @click="connect({ connector: c })"
          >
            {{ isPending ? 'Connecting…' : `Connect ${c.name}` }}
          </button>
        </template>
        <button v-else :style="btn" @click="disconnect()">
          Disconnect
        </button>
      </div>
    </div>

    <!-- Active account -->
    <div v-if="activeAccount.isConnected" :style="card">
      <strong>Active Account</strong>
      <p style="margin: 0.25rem 0 0.75rem; font-size: 0.85rem; word-break: break-all; color: #0f172a">
        {{ activeAccount.address }}
      </p>

      <strong style="font-size: 0.875rem">All Accounts</strong>
      <ul style="margin: 0.5rem 0 0; padding: 0; list-style: none">
        <li
          v-for="addr in activeAccount.addresses"
          :key="addr"
          style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem"
        >
          <code style="font-size: 0.8rem; word-break: break-all; flex: 1">
            {{ addr.slice(0, 14) }}…{{ addr.slice(-6) }}
          </code>
          <span v-if="addr === activeAccount.address" :style="activeBadge">active</span>
          <button
            v-else
            :style="{ ...btn, fontSize: '0.75rem', padding: '2px 10px' }"
            @click="switchActiveAccount({ account: addr })"
          >
            Switch
          </button>
        </li>
      </ul>
    </div>

    <!-- Balance — address is optional, uses active account -->
    <div v-if="activeAccount.isConnected" :style="card">
      <strong>Balance</strong>
      <span :style="badge">uses active account automatically</span>
      <p style="margin: 0.5rem 0 0; font-size: 0.9rem; color: #475569">
        {{ balance.isLoading ? '…' : balance.error ? 'error fetching' : (balance.data ?? 'n/a') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useActiveAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useHeight,
  useNetworkId,
  useSwitchActiveAccount,
} from '@growae/reactive-vue'

const networkId = useNetworkId()
const height = useHeight()
const { connect, connectors, isPending } = useConnect()
const { disconnect } = useDisconnect()
const activeAccount = useActiveAccount()
const { switchActiveAccount } = useSwitchActiveAccount()
// address is optional — defaults to active account automatically
const balance = useBalance()

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
</script>
