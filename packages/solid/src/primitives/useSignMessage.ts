import { createMutation } from '@tanstack/solid-query'
import {
  type SignMessageParameters,
  type SignMessageReturnType,
  type SignMessageErrorType,
  signMessage,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseSignMessageParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

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
