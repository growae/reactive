'use client'
import { mintToken } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export function useMintToken(p: ConfigParameter = {}) {
  const config = useConfig(p)
  const result = useMutation({
    retry: false,
    mutationKey: ['mintToken'],
    mutationFn: (input: Parameters<typeof mintToken>[1]) =>
      mintToken(config, input),
  })
  return {
    ...result,
    mintToken: result.mutate,
    mintTokenAsync: result.mutateAsync,
  }
}
