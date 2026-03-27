import type { Config, Connector } from '../createConfig'

export type GetConnectorsReturnType = readonly Connector[]

export function getConnectors(config: Config): GetConnectorsReturnType {
  return config.connectors
}
