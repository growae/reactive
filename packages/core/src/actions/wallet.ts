import type { Config, Connector } from '../createConfig.js'
import type { CallGroup } from './calls.js'

export type WalletParameters = {
  connector?: Connector | undefined
  networkId?: string | undefined
}
function wallet(config: Config, { connector, networkId }: WalletParameters) {
  const connection = config.state.connections.get(
    connector?.uid ?? config.state.current ?? '',
  )
  if (!connection) throw new Error('The requested wallet is disconnected')
  if (networkId !== undefined && networkId !== connection.networkId)
    throw new Error('Wallet is connected to a different network')
  return connection
}

export function getCapabilities(
  config: Config,
  parameters: WalletParameters = {},
) {
  const { connector } = wallet(config, parameters)
  return {
    signTransaction: typeof connector.signTransaction === 'function',
    signMessage: typeof connector.signMessage === 'function',
    watchAsset: typeof connector.watchAsset === 'function',
    showCallsStatus: typeof connector.showCallsStatus === 'function',
    signTypedData: typeof connector.signTypedData === 'function',
    switchNetwork: typeof connector.switchNetwork === 'function',
  }
}

export async function getWalletClient(
  config: Config,
  parameters: WalletParameters = {},
) {
  const connection = wallet(config, parameters)
  const provider = await connection.connector.getProvider({
    networkId: connection.networkId,
  })
  return { ...connection, provider, account: connection.activeAccount }
}

export async function watchAsset(
  config: Config,
  p: WalletParameters & { token: string },
) {
  const { connector, networkId, activeAccount } = wallet(config, p)
  if (!connector.watchAsset)
    throw new Error('This wallet does not support tracking AEX-9 assets')
  return connector.watchAsset({
    token: p.token,
    networkId,
    onAccount: activeAccount,
  })
}

export async function showCallsStatus(
  config: Config,
  p: { group: CallGroup; connector?: Connector },
) {
  const { connector, activeAccount } = wallet(config, {
    connector: p.connector,
    networkId: p.group.networkId,
  })
  if (!connector.showCallsStatus)
    throw new Error(
      'This wallet does not provide a transaction group status UI',
    )
  return connector.showCallsStatus({ group: p.group, onAccount: activeAccount })
}
