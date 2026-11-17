'use client'
import { burnToken } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export function useBurnToken(p: ConfigParameter = {}) {
  const config = useConfig(p)
  const result = useMutation({
    retry: false,
    mutationKey: ['burnToken'],
    mutationFn: (input: Parameters<typeof burnToken>[1]) =>
      burnToken(config, input),
  })
  return {
    ...result,
    burnToken: result.mutate,
    burnTokenAsync: result.mutateAsync,
  }
}
