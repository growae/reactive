import { type AccountBase, MemoryAccount } from '@aeternity/aepp-sdk'

import {
  ConnectorNotConnectedError,
  NetworkNotConfiguredError,
} from '../errors/config.js'
import { ConnectorAccountUnavailableError } from '../errors/connector.js'
import { createConnector } from './createConnector.js'

export type MemoryParameters = {
  accounts: Array<{ secretKey: string }>
  name?: string | undefined
}

memory.type = 'memory' as const

export function memory(parameters: MemoryParameters) {
  type Provider = AccountBase

  let connected = false
  let accounts: MemoryAccount[] = []

  const connectorName = parameters.name ?? 'Memory Account'

  /**
   * The account a named `onAccount` asks for, or the first when it names none.
   *
   * This connector holds every account it was configured with, so a name it
   * cannot serve is a caller error rather than a wallet limitation — and it
   * throws, because signing with `accounts[0]` instead would return a valid
   * signature attributed to somebody else: the wrong sender on a transaction,
   * the wrong signer on a message.
   */
  function accountFor(onAccount: string | undefined): MemoryAccount {
    if (onAccount == null) return accounts[0]!
    const account = accounts.find((a) => a.address === onAccount)
    if (!account) {
      throw new ConnectorAccountUnavailableError({
        connectorName,
        account: onAccount,
      })
    }
    return account
  }

  return createConnector<Provider>((config) => ({
    id: 'memory',
    name: connectorName,
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

    async signTransaction({ tx, networkId, innerTx, onAccount }) {
      if (!connected) throw new ConnectorNotConnectedError()
      return accountFor(onAccount).signTransaction(tx as `tx_${string}`, {
        networkId,
        innerTx,
      })
    },

    async signMessage({ message, onAccount }) {
      if (!connected) throw new ConnectorNotConnectedError()
      const encoded = new TextEncoder().encode(message)
      const signature = await accountFor(onAccount).sign(encoded)
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
