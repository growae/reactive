import {
  type Config,
  type SignMessageParameters,
  signMessage,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseSignMessageParameters = Accessor<{
  config?: Config | undefined
}>

export function useSignMessage(
  parameters: UseSignMessageParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['signMessage'],
    mutationFn: (variables: SignMessageParameters) =>
      signMessage(config(), variables),
  }))
}

export type UseSignMessageReturnType = ReturnType<typeof useSignMessage>
