'use client'
import { signTypedData } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseSignTypedDataParameters = ConfigParameter
export type UseSignTypedDataReturnType = ReturnType<typeof useSignTypedData>
export function useSignTypedData(parameters: UseSignTypedDataParameters = {}) {
  const config = useConfig(parameters)
  const result = useMutation({
    retry: false,
    mutationKey: ['signTypedData'],
    mutationFn: (input: Parameters<typeof signTypedData>[1]) =>
      signTypedData(config, input),
  })
  return {
    ...result,
    signTypedData: result.mutate,
    signTypedDataAsync: result.mutateAsync,
  }
}
