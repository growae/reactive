import type { Config, Connector } from '../createConfig.js'

export type GetConnectorsReturnType = readonly Connector[]

export function getConnectors(config: Config): GetConnectorsReturnType {
  return config.connectors
}
