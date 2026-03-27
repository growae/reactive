import {
  type GetNetworkIdReturnType,
  getNetworkId,
  watchNetworkId,
} from '@growae/reactive'
import { type Accessor, createEffect, createSignal, onCleanup } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseNetworkIdParameters = Accessor<{ config?: import('@growae/reactive').Config | undefined }>

export type UseNetworkIdReturnType = Accessor<GetNetworkIdReturnType>

export function useNetworkId(
  parameters: UseNetworkIdParameters = () => ({}),
): UseNetworkIdReturnType {
  const config = useConfig(parameters)
  const [networkId, setNetworkId] = createSignal(getNetworkId(config()))

  createEffect(() => {
    const _config = config()
    setNetworkId(() => getNetworkId(_config))
    const unsubscribe = watchNetworkId(_config, {
      onChange(data) {
        setNetworkId(() => data)
      },
    })
    onCleanup(() => unsubscribe())
  })

  return networkId
}
