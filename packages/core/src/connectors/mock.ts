import {
  ConnectorNotConnectedError,
  NetworkNotConfiguredError,
} from '../errors/config.js'
import { ConnectorAccountUnavailableError } from '../errors/connector.js'
import { createConnector } from './createConnector.js'

export type MockParameters = {
  accounts: readonly [string, ...string[]]
  features?:
    | {
        defaultConnected?: boolean | undefined
        connectError?: boolean | Error | undefined
        switchNetworkError?: boolean | Error | undefined
        signMessageError?: boolean | Error | undefined
        signTransactionError?: boolean | Error | undefined
        reconnect?: boolean | undefined
      }
    | undefined
}

mock.type = 'mock' as const

export function mock(parameters: MockParameters) {
  const features =
    parameters.features ??
    ({ defaultConnected: false } satisfies MockParameters['features'])

  type Provider = {
    request(args: { method: string; params?: unknown[] }): Promise<unknown>
  }

  let connected = features.defaultConnected ?? false
  let connectedNetworkId: string

  /**
   * The mock holds a fixed account list, so a named account outside it is the
   * same defect a wallet connector would reject — and it is rejected here too,
   * so a test that pins the wrong account fails in the test rather than in
   * whatever the mock stands in for. Both signing paths check it: a message
   * signed by an account the caller did not name verifies against the wrong
   * address, which is a wrong answer returned as a successful one.
   */
  function assertCanSignFor(onAccount: string | undefined) {
    if (onAccount == null) return
    if (!parameters.accounts.includes(onAccount)) {
      throw new ConnectorAccountUnavailableError({
        connectorName: 'Mock Connector',
        account: onAccount,
      })
    }
  }

  return createConnector<Provider>((config) => ({
    id: 'mock',
    name: 'Mock Connector',
    type: mock.type,

    async setup() {
      connectedNetworkId = config.networks[0].id
    },

    async connect({ networkId } = {}) {
      if (features.connectError) {
        if (typeof features.connectError === 'boolean')
          throw new Error('Failed to connect.')
        throw features.connectError
      }

      let currentNetworkId = await this.getNetworkId()
      if (networkId && currentNetworkId !== networkId) {
        const network = await this.switchNetwork!({ networkId })
        currentNetworkId = network.id
      }

      connected = true
      return {
        accounts: parameters.accounts as unknown as readonly string[],
        networkId: currentNetworkId,
      }
    },

    async disconnect() {
      connected = false
    },

    async getAccounts() {
      if (!connected) throw new ConnectorNotConnectedError()
      return parameters.accounts as unknown as readonly string[]
    },

    async getNetworkId() {
      return connectedNetworkId
    },

    async getProvider() {
      return {
        async request({ method }: { method: string }) {
          if (method === 'accounts') return parameters.accounts
          if (method === 'networkId') return connectedNetworkId
          return null
        },
      }
    },

    async isAuthorized() {
      if (!features.reconnect) return false
      if (!connected) return false
      const accounts = await this.getAccounts()
      return !!accounts.length
    },

    async switchNetwork({ networkId }) {
      if (features.switchNetworkError) {
        if (typeof features.switchNetworkError === 'boolean')
          throw new Error('Failed to switch network.')
        throw features.switchNetworkError
      }

      const network = config.networks.find((n) => n.id === networkId)
      if (!network) throw new NetworkNotConfiguredError()

      connectedNetworkId = networkId
      this.onNetworkChanged(networkId)
      return network
    },

    async signTransaction({ tx, onAccount }) {
      if (features.signTransactionError) {
        if (typeof features.signTransactionError === 'boolean')
          throw new Error('Failed to sign transaction.')
        throw features.signTransactionError
      }
      assertCanSignFor(onAccount)
      return `signed_${tx}`
    },

    async signMessage({ message, onAccount }) {
      if (features.signMessageError) {
        if (typeof features.signMessageError === 'boolean')
          throw new Error('Failed to sign message.')
        throw features.signMessageError
      }
      assertCanSignFor(onAccount)
      return `signed_${message}`
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
