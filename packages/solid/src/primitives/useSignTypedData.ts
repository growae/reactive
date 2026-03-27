import { createMutation } from '@tanstack/solid-query'
import {
  type SignTypedDataParameters,
  type SignTypedDataReturnType,
  type SignTypedDataErrorType,
  signTypedData,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseSignTypedDataParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

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
