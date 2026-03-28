import {
  type Config,
  type SignTypedDataParameters,
  signTypedData,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseSignTypedDataParameters = Accessor<{
  config?: Config | undefined
}>

export function useSignTypedData(
  parameters: UseSignTypedDataParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['signTypedData'],
    mutationFn: (variables: SignTypedDataParameters) =>
      signTypedData(config(), variables),
  }))
}

export type UseSignTypedDataReturnType = ReturnType<typeof useSignTypedData>
