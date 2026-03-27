import type { AccountLedgerFactory } from '@aeternity/aepp-sdk'
import {
  ConnectorNotConnectedError,
  NetworkNotConfiguredError,
  ProviderNotFoundError,
  createConnector,
} from '@growae/reactive'

export type LedgerParameters = {
  /**
   * A Ledger transport instance (`@ledgerhq/hw-transport`).
   * The caller is responsible for creating the transport (USB, Bluetooth, …).
   */
  transport: unknown
  /** HD account index to use. @default 0 */
  accountIndex?: number | undefined
  /** Display name shown in connector lists. */
  name?: string | undefined
}

ledger.type = 'ledger' as const

/**
 * Connector for Ledger hardware wallets via the Aeternity Ledger app.
 *
 * Wraps `AccountLedgerFactory` from `@aeternity/aepp-sdk`, handling address
 * derivation, transaction signing, and message signing through the device.
 */
export function ledger(parameters: LedgerParameters) {
  type Provider = AccountLedgerFactory

  let factory: AccountLedgerFactory | undefined
  let connected = false
  let currentAccounts: readonly string[] = []
  let connectedNetworkId: string

  const accountIndex = parameters.accountIndex ?? 0

  return createConnector<Provider>((config) => ({
    id: 'ledger',
    name: parameters.name ?? 'Ledger',
    type: ledger.type,

    async setup() {
      connectedNetworkId = config.networks[0].id
    },

    async connect({ networkId } = {}) {
      const { AccountLedgerFactory: Factory } = await import(
        '@aeternity/aepp-sdk'
      )

      factory = new Factory(parameters.transport as never)
      await factory.ensureReady()

      const address = await factory.getAddress(accountIndex)
      currentAccounts = [address]
      connected = true

      const targetNetworkId = networkId ?? connectedNetworkId
      const isConfigured = config.networks.some((n) => n.id === targetNetworkId)
      if (!isConfigured) throw new NetworkNotConfiguredError()
      connectedNetworkId = targetNetworkId

      return {
        accounts: currentAccounts,
        networkId: connectedNetworkId,
      }
    },

    async disconnect() {
      connected = false
      factory = undefined
      currentAccounts = []
    },

    async getAccounts() {
      if (!connected) throw new ConnectorNotConnectedError()
      return currentAccounts
    },

    async getNetworkId() {
      return connectedNetworkId
    },

    async getProvider() {
      if (!factory) throw new ProviderNotFoundError()
      return factory
    },

    async isAuthorized() {
      return connected && currentAccounts.length > 0
    },

    async switchNetwork({ networkId }) {
      const network = config.networks.find((n) => n.id === networkId)
      if (!network) throw new NetworkNotConfiguredError()
      connectedNetworkId = networkId
      config.emitter.emit('change', { networkId })
      return network
    },

    async signTransaction({ tx, networkId, innerTx }) {
      if (!factory || !connected) throw new ConnectorNotConnectedError()
      const account = await factory.initialize(accountIndex)
      return account.signTransaction(tx, {
        networkId,
        innerTx,
      })
    },

    async signMessage({ message }) {
      if (!factory || !connected) throw new ConnectorNotConnectedError()
      const account = await factory.initialize(accountIndex)
      const signature = await account.signMessage(message)
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
      currentAccounts = []
    },
  }))
}
