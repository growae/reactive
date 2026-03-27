import {
  createConnector,
  ConnectorNotConnectedError,
  ProviderNotFoundError,
  NetworkNotConfiguredError,
} from '@reactive/core'

export type MetaMaskSnapParameters = {
  /** Snap package ID. @default 'npm:@aeternity-snap/plugin' */
  snapId?: string | undefined
  /** Semver range for the snap version. */
  snapVersion?: string | undefined
  /** HD account index. @default 0 */
  accountIndex?: number | undefined
  /** Display name shown in connector lists. */
  name?: string | undefined
}

type EthereumProvider = {
  request<T = unknown>(args: {
    method: string
    params?: unknown
  }): Promise<T>
}

metamaskSnap.type = 'metamaskSnap' as const

/**
 * Connector for Aeternity MetaMask Snap.
 *
 * Uses the MetaMask Snaps API to enable Aeternity account management
 * and transaction signing through MetaMask.
 */
export function metamaskSnap(parameters: MetaMaskSnapParameters = {}) {
  type Provider = EthereumProvider

  const SNAP_ID = parameters.snapId ?? 'npm:@aeternity-snap/plugin'
  const accountIndex = parameters.accountIndex ?? 0

  let provider: EthereumProvider | undefined
  let connected = false
  let currentAccounts: readonly string[] = []
  let connectedNetworkId: string

  function getEthereumProvider(): EthereumProvider {
    if (typeof window === 'undefined' || !(window as any).ethereum)
      throw new ProviderNotFoundError()
    return (window as any).ethereum as EthereumProvider
  }

  async function invokeSnap<R>(
    method: string,
    params: unknown,
    key: string,
  ): Promise<R> {
    if (!provider) throw new ProviderNotFoundError()
    const response = await provider.request<Record<string, unknown>>({
      method: 'wallet_invokeSnap',
      params: { snapId: SNAP_ID, request: { method, params } },
    })
    if (response == null || !(key in response))
      throw new Error(`Unexpected snap response for ${method}`)
    return response[key] as R
  }

  return createConnector<Provider>((config) => ({
    id: 'metamaskSnap',
    name: parameters.name ?? 'MetaMask Snap',
    type: metamaskSnap.type,

    async setup() {
      connectedNetworkId = config.networks[0].id
    },

    async connect({ networkId } = {}) {
      provider = getEthereumProvider()

      const snapVersionParam = parameters.snapVersion
        ? { version: parameters.snapVersion }
        : {}
      await provider.request({
        method: 'wallet_requestSnaps',
        params: { [SNAP_ID]: snapVersionParam },
      })

      const address = await invokeSnap<string>(
        'getPublicKey',
        { derivationPath: [`${accountIndex}'`, "0'", "0'"] },
        'publicKey',
      )

      currentAccounts = [address]
      connected = true

      const targetNetworkId = networkId ?? connectedNetworkId
      const isConfigured = config.networks.some(
        (n) => n.id === targetNetworkId,
      )
      if (!isConfigured) throw new NetworkNotConfiguredError()
      connectedNetworkId = targetNetworkId

      return {
        accounts: currentAccounts,
        networkId: connectedNetworkId,
      }
    },

    async disconnect() {
      connected = false
      provider = undefined
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
      if (!provider) throw new ProviderNotFoundError()
      return provider
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
      if (!provider || !connected) throw new ConnectorNotConnectedError()
      return invokeSnap<string>(
        'signTransaction',
        {
          derivationPath: [`${accountIndex}'`, "0'", "0'"],
          tx,
          networkId,
          ...(innerTx != null ? { innerTx } : {}),
        },
        'signedTx',
      )
    },

    async signMessage({ message }) {
      if (!provider || !connected) throw new ConnectorNotConnectedError()
      const signature = await invokeSnap<string>(
        'signMessage',
        {
          derivationPath: [`${accountIndex}'`, "0'", "0'"],
          message: Buffer.from(message).toString('base64'),
        },
        'signature',
      )
      return Buffer.from(signature, 'base64').toString('hex')
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
