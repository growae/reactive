import type { Config } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { type UseQueryReturnType, useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type QueryParameters = ConfigParameter & {
  networkId?: string | undefined
  enabled?: boolean | undefined
}
export function useActionQuery<P extends object, R>(
  key: string,
  action: (config: Config, p: P) => Promise<R>,
  parameters: P & QueryParameters,
  ready = true,
): UseQueryReturnType<R, Error> {
  const config = useConfig(parameters)
  const activeNetwork = useNetworkId({ config })
  const { config: _config, enabled = true, ...input } = parameters
  const networkId = parameters.networkId ?? activeNetwork
  return useQuery<R, Error, R, readonly unknown[]>({
    queryKey: [key, { ...input, networkId }],
    queryFn: ({ signal }) =>
      action(config, { ...parameters, networkId, signal }),
    enabled: ready && enabled,
  })
}
