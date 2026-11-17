import { canonicalAci, wireDomain } from '../actions/typedData.js'
import {
  ConnectorNotConnectedError,
  NetworkNotConfiguredError,
} from '../errors/config.js'
import { ConnectorAccountUnavailableError } from '../errors/connector.js'
import { loadProtocol } from '../exports/protocol.js'
import { createConnector } from './createConnector.js'

export type MemoryParameters = {
  accounts: Array<{ secretKey: string }>
  name?: string | undefined
}

memory.type = 'memory' as const

export function memory(parameters: MemoryParameters) {
  type Provider = { address: string }
  type Account = Provider & { secretKey: string }

  let connected = false
  let activeNetwork: string | undefined
  let accounts: Account[] = []

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
  function accountFor(onAccount: string | undefined): Account {
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

    async connect({ networkId } = {}) {
      const targetNetworkId = networkId ?? config.networks[0].id

      const isConfigured = config.networks.some((n) => n.id === targetNetworkId)
      if (!isConfigured) throw new NetworkNotConfiguredError()

      const { keys } = await loadProtocol()
      accounts = parameters.accounts.map(({ secretKey }) => ({
        secretKey,
        address: keys.addressFromSecret(secretKey),
      }))
      if (!accounts.length)
        throw new Error('A memory connector requires an account')
      activeNetwork = targetNetworkId
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
      return activeNetwork ?? config.networks[0].id
    },

    async getProvider() {
      if (!connected) throw new ConnectorNotConnectedError()
      return { address: accounts[0]!.address }
    },

    async isAuthorized() {
      return connected
    },

    async switchNetwork({ networkId }) {
      const network = config.networks.find((n) => n.id === networkId)
      if (!network) throw new NetworkNotConfiguredError()
      activeNetwork = networkId
      config.emitter.emit('change', { networkId })
      return network
    },

    async signTransaction({ tx, networkId, innerTx, onAccount }) {
      if (!connected) throw new ConnectorNotConnectedError()
      const { keys, encoding, tx: transactions } = await loadProtocol()
      const signature = keys.signTransaction(
        accountFor(onAccount).secretKey,
        tx,
        networkId,
        innerTx ?? false,
      )
      return transactions.wrapSigned([encoding.decode(signature)], tx)
    },

    async signMessage({ message, onAccount }) {
      if (!connected) throw new ConnectorNotConnectedError()
      const { keys, encoding } = await loadProtocol()
      const signature = keys.signMessage(
        accountFor(onAccount).secretKey,
        message,
      )
      return Array.from(encoding.decode(signature), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join('')
    },

    async signTypedData({ data, aci, domain, onAccount }) {
      if (!connected) throw new ConnectorNotConnectedError()
      const { typedData } = await loadProtocol()
      return typedData.sign(
        accountFor(onAccount).secretKey,
        data,
        canonicalAci(aci),
        wireDomain(domain),
      )
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.onDisconnect()
      else config.emitter.emit('change', { accounts })
    },

    onNetworkChanged(networkId) {
      activeNetwork = networkId
      config.emitter.emit('change', { networkId })
    },

    onDisconnect() {
      config.emitter.emit('disconnect')
      connected = false
    },
  }))
}
