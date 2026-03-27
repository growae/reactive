import { type ConnectParameters, connect } from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import { type Accessor, createEffect, onCleanup } from 'solid-js'
import { useConfig } from './useConfig'

export type UseConnectParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

export function useConnect(parameters: UseConnectParameters = () => ({})) {
  const config = useConfig(parameters)
  const mutation = createMutation(() => ({
    mutationKey: ['connect'],
    mutationFn: (variables: ConnectParameters) => connect(config(), variables),
  }))

  createEffect(() => {
    const unsubscribe = config().subscribe(
      ({ status }) => status,
      (status, previousStatus) => {
        if (previousStatus === 'connected' && status === 'disconnected') {
          mutation.reset()
        }
      },
    )
    onCleanup(() => unsubscribe())
  })

  return mutation
}

export type UseConnectReturnType = ReturnType<typeof useConnect>
