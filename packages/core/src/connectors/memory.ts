import { type AccountBase, MemoryAccount } from '@aeternity/aepp-sdk'

import {
  ConnectorNotConnectedError,
  NetworkNotConfiguredError,
} from '../errors/config'
import { createConnector } from './createConnector'

export type MemoryParameters = {
  accounts: Array<{ secretKey: string }>
  name?: string | undefined
}

memory.type = 'memory' as const

export function memory(parameters: MemoryParameters) {
  type Provider = AccountBase

  let connected = false
  let accounts: MemoryAccount[] = []

  return createConnector<Provider>((config) => ({
    id: 'memory',
    name: parameters.name ?? 'Memory Account',
    type: memory.type,

    async setup() {
      accounts = parameters.accounts.map(
        (a) => new MemoryAccount(a.secretKey as `sk_${string}`),
      )
    },

    async connect({ networkId } = {}) {
      const targetNetworkId = networkId ?? config.networks[0].id

      const isConfigured = config.networks.some((n) => n.id === targetNetworkId)
      if (!isConfigured) throw new NetworkNotConfiguredError()

      connected = true
      return {
        accounts: accounts.map((a) => a.address),
        networkId: targetNetworkId,
      }
    },

    async disconnect() {
      connected = false
    },

    async getAccounts() {
      if (!connected) throw new ConnectorNotConnectedError()
      return accounts.map((a) => a.address)
    },

    async getNetworkId() {
      return config.networks[0].id
    },

    async getProvider() {
      return accounts[0]!
    },

    async isAuthorized() {
      return connected
    },

    async switchNetwork({ networkId }) {
      const network = config.networks.find((n) => n.id === networkId)
      if (!network) throw new NetworkNotConfiguredError()
      config.emitter.emit('change', { networkId })
      return network
    },

    async signTransaction({ tx }) {
      if (!connected) throw new ConnectorNotConnectedError()
      return accounts[0]!.signTransaction(tx as `tx_${string}`)
    },

    async signMessage({ message }) {
      if (!connected) throw new ConnectorNotConnectedError()
      const encoded = new TextEncoder().encode(message)
      const signature = await accounts[0]!.sign(encoded)
      return Buffer.from(signature).toString('hex')
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.onDisconnect()
      else config.emitter.emit('change', { accounts })
    },

    onNetworkChanged(networkId) {
      config.emitter.emit('change', { networkId })
    },

    onDisconnect() {
      config.emitter.emit('disconnect')
      connected = false
    },
  }))
}
