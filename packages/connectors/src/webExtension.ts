import type { WalletConnectorFrame } from '@aeternity/aepp-sdk'
import {
  ConnectorNotConnectedError,
  ProviderNotFoundError,
  createConnector,
} from '@growae/reactive'

export type WebExtensionParameters = {
  /** Name advertised to the wallet during connection handshake. */
  name?: string | undefined
  /** Enable debug logging on the underlying runtime connection. */
  debug?: boolean | undefined
}

webExtension.type = 'webExtension' as const

/**
 * Connector for browser-extension wallets that expose a
 * `BrowserRuntimeConnection` port (e.g. content-script ↔ background page).
 *
 * Detects available wallets via the standard wallet-detector flow and
 * connects to the first one found, or waits until one becomes available.
 */
export function webExtension(parameters: WebExtensionParameters = {}) {
  type Provider = WalletConnectorFrame

  let provider: WalletConnectorFrame | undefined
  let currentNetworkId = ''
  let currentAccounts: readonly string[] = []
  let stopDetection: (() => void) | undefined

  return createConnector<Provider>((config) => ({
    id: 'webExtension',
    name: 'Web Extension Wallet',
    type: webExtension.type,

    async connect({ networkId } = {}) {
      const {
        WalletConnectorFrame: WCF,
        BrowserWindowMessageConnection,
        walletDetector,
      } = await import('@aeternity/aepp-sdk')

      const scanConnection = new BrowserWindowMessageConnection({
        debug: parameters.debug,
      })

      const wallet = await new Promise<{
        info: { id: string; name: string; networkId: string; type: string }
        getConnection: () => InstanceType<typeof BrowserWindowMessageConnection>
      }>((resolve) => {
        stopDetection = walletDetector(scanConnection, ({ newWallet }) => {
          resolve(newWallet as never)
        })
      })
      stopDetection?.()
      stopDetection = undefined

      const walletConnection = wallet.getConnection()
      const frame = await WCF.connect(
        parameters.name ?? 'Reactive dApp',
        walletConnection,
      )

      provider = frame
      currentNetworkId = frame.networkId

      const accounts = await frame.subscribeAccounts(
        'subscribe' as never,
        'connected',
      )
      currentAccounts = accounts.map((a) => a.address)

      frame.on('accountsChange', (accs: readonly { address: string }[]) => {
        currentAccounts = accs.map((a: { address: string }) => a.address)
        this.onAccountsChanged([...currentAccounts])
      })

      frame.on('networkIdChange', (nId: string) => {
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
      stopDetection?.()
      stopDetection = undefined
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
      return account.signTransaction(tx as `tx_${string}`, {
        networkId,
        innerTx,
      })
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
      stopDetection?.()
      stopDetection = undefined
      provider = undefined
      currentAccounts = []
    },
  }))
}
