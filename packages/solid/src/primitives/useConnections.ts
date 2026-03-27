import {
  type GetConnectionsReturnType,
  getConnections,
  watchConnections,
} from '@reactive/core'
import { type Accessor, createEffect, createSignal, onCleanup } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseConnectionsParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

export type UseConnectionsReturnType = Accessor<GetConnectionsReturnType>

export function useConnections(
  parameters: UseConnectionsParameters = () => ({}),
): UseConnectionsReturnType {
  const config = useConfig(parameters)
  const [connections, setConnections] = createSignal(getConnections(config()))

  createEffect(() => {
    const _config = config()
    setConnections(() => getConnections(_config))
    const unsubscribe = watchConnections(_config, {
      onChange(data) {
        setConnections(() => data)
      },
    })
    onCleanup(() => unsubscribe())
  })

  return connections
}
