'use client'
import { createTokenAllowance } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export function useCreateTokenAllowance(p: ConfigParameter = {}) {
  const config = useConfig(p)
  const result = useMutation({
    retry: false,
    mutationKey: ['createTokenAllowance'],
    mutationFn: (input: Parameters<typeof createTokenAllowance>[1]) =>
      createTokenAllowance(config, input),
  })
  return {
    ...result,
    createTokenAllowance: result.mutate,
    createTokenAllowanceAsync: result.mutateAsync,
  }
}
