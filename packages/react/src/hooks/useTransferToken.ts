'use client'
import { transferToken } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export function useTransferToken(p: ConfigParameter = {}) {
  const config = useConfig(p)
  const result = useMutation({
    retry: false,
    mutationKey: ['transferToken'],
    mutationFn: (input: Parameters<typeof transferToken>[1]) =>
      transferToken(config, input),
  })
  return {
    ...result,
    transferToken: result.mutate,
    transferTokenAsync: result.mutateAsync,
  }
}
