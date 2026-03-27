import type { Config, Connection } from '../createConfig'

export type GetConnectionReturnType = Connection | undefined

export function getConnection(config: Config): GetConnectionReturnType {
  const { connections, current } = config.state
  if (!current) return undefined
  return connections.get(current)
}
