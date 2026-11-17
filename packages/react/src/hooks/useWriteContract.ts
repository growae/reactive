'use client'
import { callContract } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export function useWriteContract(p: ConfigParameter = {}) {
  const config = useConfig(p)
  const mutation = useMutation({
    mutationKey: ['writeContract'],
    mutationFn: (parameters: Parameters<typeof callContract>[1]) =>
      callContract(config, parameters),
    retry: false,
  })
  return {
    ...mutation,
    writeContract: mutation.mutate,
    writeContractAsync: mutation.mutateAsync,
  }
}
