import { createMutation } from '@tanstack/solid-query'
import {
  type SignTypedDataParameters,
  type SignTypedDataReturnType,
  type SignTypedDataErrorType,
  signTypedData,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseSignTypedDataParameters = Accessor<{ config?: import('@growae/reactive').Config | undefined }>

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
