import {
  type GetConnectionsReturnType,
  getConnections,
  watchConnections,
} from '@growae/reactive'
import { type Accessor, createEffect, createSignal, onCleanup } from 'solid-js'
import { useConfig } from './useConfig'

export type UseConnectionsParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

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
