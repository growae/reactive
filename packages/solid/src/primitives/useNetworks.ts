import { type GetNetworksReturnType, getNetworks } from '@growae/reactive'
import { createMemo } from 'solid-js'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseNetworksParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

export type UseNetworksReturnType = Accessor<GetNetworksReturnType>

export function useNetworks(
  parameters: UseNetworksParameters = () => ({}),
): UseNetworksReturnType {
  const config = useConfig(parameters)
  return createMemo(() => getNetworks(config()))
}
