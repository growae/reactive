import { type AccountBase, MemoryAccount } from '@aeternity/aepp-sdk'

import {
  ConnectorNotConnectedError,
  NetworkNotConfiguredError,
} from '../errors/config.js'
import { createConnector } from './createConnector.js'

export type MemoryParameters = {
  secretKey: string
  name?: string | undefined
}

memory.type = 'memory' as const

export function memory(parameters: MemoryParameters) {
  type Provider = AccountBase

  let connected = false
  let account: MemoryAccount

  return createConnector<Provider>((config) => ({
    id: 'memory',
    name: parameters.name ?? 'Memory Account',
    type: memory.type,

    async setup() {
      account = new MemoryAccount(parameters.secretKey as `sk_${string}`)
    },

    async connect({ networkId } = {}) {
      const targetNetworkId = networkId ?? config.networks[0].id

      const isConfigured = config.networks.some((n) => n.id === targetNetworkId)
      if (!isConfigured) throw new NetworkNotConfiguredError()

      connected = true
      return {
        accounts: [account.address],
        networkId: targetNetworkId,
      }
    },

    async disconnect() {
      connected = false
    },

    async getAccounts() {
      if (!connected) throw new ConnectorNotConnectedError()
      return [account.address]
    },

    async getNetworkId() {
      return config.networks[0].id
    },

    async getProvider() {
      return account
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
      return account.signTransaction(tx as `tx_${string}`)
    },

    async signMessage({ message }) {
      if (!connected) throw new ConnectorNotConnectedError()
      const encoded = new TextEncoder().encode(message)
      const signature = await account.sign(encoded)
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
