import type { GetNetworksReturnType } from '@growae/reactive'
import { getNetworks } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties'
import { useConfig } from './useConfig'

export type UseNetworksParameters = ConfigParameter

export type UseNetworksReturnType = GetNetworksReturnType

export function useNetworks(
  parameters: UseNetworksParameters = {},
): UseNetworksReturnType {
  const config = useConfig(parameters)
  return getNetworks(config)
}
