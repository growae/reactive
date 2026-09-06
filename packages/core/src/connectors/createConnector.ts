import type { Emitter } from '../createEmitter.js'
import type { Storage } from '../createStorage.js'
import type { Network } from '../types/network.js'
import type { Compute } from '../types/utils.js'

export type ConnectorEventMap = {
  change: {
    accounts?: readonly string[] | undefined
    networkId?: string | undefined
  }
  connect: { accounts: readonly string[]; networkId: string }
  disconnect: never
  error: { error: Error }
  message: { type: string; data?: unknown | undefined }
}

export type CreateConnectorFn<
  provider = unknown,
  properties extends Record<string, unknown> = Record<string, unknown>,
  storageItem extends Record<string, unknown> = Record<string, unknown>,
> = (config: {
  networks: readonly [Network, ...Network[]]
  emitter: Emitter<ConnectorEventMap>
  storage?: Compute<Storage<storageItem>> | null | undefined
}) => Compute<
  {
    readonly icon?: string | undefined
    readonly id: string
    readonly name: string
    readonly type: string

    setup?(): Promise<void>
    connect(parameters?: {
      networkId?: string | undefined
      isReconnecting?: boolean | undefined
    }): Promise<{
      accounts: readonly string[]
      networkId: string
    }>
    disconnect(): Promise<void>
    getAccounts(): Promise<readonly string[]>
    getNetworkId(): Promise<string>
    getProvider(
      parameters?: { networkId?: string | undefined } | undefined,
    ): Promise<provider>
    isAuthorized(): Promise<boolean>
    switchNetwork?(parameters: { networkId: string }): Promise<Network>

    signTransaction?(params: {
      tx: string
      networkId: string
      innerTx?: boolean | undefined
    }): Promise<string>
    signMessage?(params: {
      message: string
      onAccount?: string | undefined
    }): Promise<string>

    onAccountsChanged(accounts: string[]): void
    onNetworkChanged(networkId: string): void
    onDisconnect(error?: Error | undefined): void
  } & properties
>

export function createConnector<
  provider,
  properties extends Record<string, unknown> = Record<string, unknown>,
  storageItem extends Record<string, unknown> = Record<string, unknown>,
  createConnectorFn extends CreateConnectorFn<
    provider,
    properties,
    storageItem
  > = CreateConnectorFn<provider, properties, storageItem>,
>(createConnectorFn: createConnectorFn) {
  return createConnectorFn
}
