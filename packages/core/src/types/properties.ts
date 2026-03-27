import type { Config, Connector } from '../createConfig.js'

export type NetworkIdParameter<
  config extends Config = Config,
  networkId extends
    | config['networks'][number]['id']
    | undefined = config['networks'][number]['id'],
> = {
  networkId?:
    | (networkId extends config['networks'][number]['id']
        ? networkId
        : undefined)
    | config['networks'][number]['id']
    | undefined
}

export type ConfigParameter<config extends Config = Config> = {
  config?: Config | config | undefined
}

export type ConnectorParameter = {
  connector?: Connector | undefined
}

export type AccountParameter = {
  account?: string | undefined
}

export type EnabledParameter = {
  enabled?: boolean | undefined
}

export type ScopeKeyParameter = { scopeKey?: string | undefined }

export type SyncConnectedNetworkParameter = {
  syncConnectedNetwork?: boolean | undefined
}
