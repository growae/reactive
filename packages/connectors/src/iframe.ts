import type { WalletConnectorFrame } from '@aeternity/aepp-sdk'
import {
  ConnectorNotConnectedError,
  ProviderNotFoundError,
  createConnector,
} from '@growae/reactive'

export type IframeParameters = {
  /** Name advertised to the wallet during connection handshake. */
  name?: string | undefined
  /** Target window that hosts the wallet (defaults to `window.parent`). */
  target?: Window | undefined
  /** Expected origin of the wallet window, for security validation. */
  origin?: string | undefined
  /** Enable debug logging on the underlying message connection. */
  debug?: boolean | undefined
}

iframe.type = 'iframe' as const

/**
 * Connector for dapps embedded inside an iframe that communicate with a
 * wallet running in the parent (or another) window via `postMessage`.
 */
export function iframe(parameters: IframeParameters = {}) {
  type Provider = WalletConnectorFrame

  let provider: WalletConnectorFrame | undefined
  let currentNetworkId = ''
  let currentAccounts: readonly string[] = []

  return createConnector<Provider>((config) => ({
    id: 'iframe',
    name: 'Iframe Wallet',
    type: iframe.type,

    async connect({ networkId } = {}) {
      const { WalletConnectorFrame: WCF, BrowserWindowMessageConnection } =
        await import('@aeternity/aepp-sdk')

      const target =
        parameters.target ??
        (typeof window !== 'undefined' ? window.parent : undefined)

      const connection = new BrowserWindowMessageConnection({
        target: target as never,
        origin: parameters.origin,
        debug: parameters.debug,
      })

      const frame = await WCF.connect(
        parameters.name ?? 'Reactive dApp',
        connection,
      )

      provider = frame
      currentNetworkId = frame.networkId

      const accounts = await frame.subscribeAccounts(
        'subscribe' as never,
        'connected',
      )
      currentAccounts = accounts.map((a) => a.address)

      frame.on('accountsChange', (accs) => {
        currentAccounts = accs.map((a) => a.address)
        this.onAccountsChanged([...currentAccounts])
      })

      frame.on('networkIdChange', (nId) => {
        currentNetworkId = nId
        this.onNetworkChanged(nId)
      })

      frame.on('disconnect', () => {
        this.onDisconnect()
      })

      const targetNetworkId = networkId ?? currentNetworkId
      if (networkId && networkId !== currentNetworkId) {
        await frame.askToSelectNetwork({ networkId })
        currentNetworkId = networkId
      }

      return {
        accounts: currentAccounts,
        networkId: targetNetworkId,
      }
    },

    async disconnect() {
      if (provider) {
        provider.disconnect()
        provider = undefined
      }
      currentAccounts = []
      currentNetworkId = ''
    },

    async getAccounts() {
      if (!provider) throw new ConnectorNotConnectedError()
      return currentAccounts
    },

    async getNetworkId() {
      return currentNetworkId
    },

    async getProvider() {
      if (!provider) throw new ProviderNotFoundError()
      return provider
    },

    async isAuthorized() {
      if (!provider) return false
      return provider.isConnected && currentAccounts.length > 0
    },

    async signTransaction({ tx, networkId, innerTx }) {
      if (!provider) throw new ConnectorNotConnectedError()
      const account = provider.accounts[0]
      if (!account) throw new ConnectorNotConnectedError()
      return account.signTransaction(tx, { networkId, innerTx })
    },

    async signMessage({ message, onAccount }) {
      if (!provider) throw new ConnectorNotConnectedError()
      const account = onAccount
        ? (provider.accounts.find((a) => a.address === onAccount) ??
          provider.accounts[0])
        : provider.accounts[0]
      if (!account) throw new ConnectorNotConnectedError()
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
      provider = undefined
      currentAccounts = []
    },
  }))
}
