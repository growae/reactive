import {
  type GetConnectionReturnType,
  getConnection,
  watchConnection,
} from '@growae/reactive'
import { type Accessor, createEffect, createSignal, onCleanup } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseConnectionParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

export type UseConnectionReturnType = Accessor<GetConnectionReturnType>

export function useConnection(
  parameters: UseConnectionParameters = () => ({}),
): UseConnectionReturnType {
  const config = useConfig(parameters)
  const [connection, setConnection] = createSignal(getConnection(config()))

  createEffect(() => {
    const _config = config()
    setConnection(() => getConnection(_config))
    const unsubscribe = watchConnection(_config, {
      onChange(data) {
        setConnection(() => data)
      },
    })
    onCleanup(() => unsubscribe())
  })

  return connection
}
