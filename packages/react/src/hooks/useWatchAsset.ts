'use client'
import { watchAsset } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
export function useWatchAsset(p: ConfigParameter = {}) {
  const config = useConfig(p)
  const mutation = useMutation({
    mutationKey: ['watchAsset'],
    mutationFn: (input: Parameters<typeof watchAsset>[1]) =>
      watchAsset(config, input),
    retry: false,
  })
  return {
    ...mutation,
    watchAsset: mutation.mutate,
    watchAssetAsync: mutation.mutateAsync,
  }
}
