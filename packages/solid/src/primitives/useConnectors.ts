import {
  type GetConnectorsReturnType,
  getConnectors,
  watchConnectors,
} from '@growae/reactive'
import { type Accessor, createEffect, createSignal, onCleanup } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseConnectorsParameters = Accessor<{ config?: import('@growae/reactive').Config | undefined }>

export type UseConnectorsReturnType = Accessor<GetConnectorsReturnType>

export function useConnectors(
  parameters: UseConnectorsParameters = () => ({}),
): UseConnectorsReturnType {
  const config = useConfig(parameters)
  const [connectors, setConnectors] = createSignal(getConnectors(config()))

  createEffect(() => {
    const _config = config()
    setConnectors(() => getConnectors(_config))
    const unsubscribe = watchConnectors(_config, {
      onChange(data) {
        setConnectors(() => data)
      },
    })
    onCleanup(() => unsubscribe())
  })

  return connectors
}
