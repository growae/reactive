'use client'
import { showCallsStatus } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
export function useShowCallsStatus(p: ConfigParameter = {}) {
  const config = useConfig(p)
  const mutation = useMutation({
    mutationKey: ['showCallsStatus'],
    mutationFn: (input: Parameters<typeof showCallsStatus>[1]) =>
      showCallsStatus(config, input),
    retry: false,
  })
  return {
    ...mutation,
    showCallsStatus: mutation.mutate,
    showCallsStatusAsync: mutation.mutateAsync,
  }
}
