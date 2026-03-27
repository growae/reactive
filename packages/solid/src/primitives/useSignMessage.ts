import {
  type SignMessageErrorType,
  type SignMessageParameters,
  type SignMessageReturnType,
  signMessage,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseSignMessageParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
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
