import {
  type GetNodeClientParameters,
  type GetNodeClientReturnType,
  getNodeClient,
  watchNodeClient,
} from '@growae/reactive'
import { type Accessor, createEffect, createSignal, onCleanup } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseNodeClientParameters = Accessor<
  GetNodeClientParameters & { config?: import('@growae/reactive').Config | undefined }
>

export type UseNodeClientReturnType = Accessor<GetNodeClientReturnType>

export function useNodeClient(
  parameters: UseNodeClientParameters = () => ({}),
): UseNodeClientReturnType {
  const config = useConfig(parameters)
  const [nodeClient, setNodeClient] = createSignal(
    getNodeClient(config(), parameters()),
  )

  createEffect(() => {
    const _config = config()
    setNodeClient(() => getNodeClient(_config, parameters()))
    const unsubscribe = watchNodeClient(_config, {
      onChange(data) {
        setNodeClient(() => data)
      },
    })
    onCleanup(() => unsubscribe())
  })

  return nodeClient
}
