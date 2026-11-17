'use client'
import { sendCalls } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export function useSendCalls(p: ConfigParameter = {}) {
  const config = useConfig(p)
  const mutation = useMutation({
    mutationKey: ['sendCalls'],
    mutationFn: (parameters: Parameters<typeof sendCalls>[1]) =>
      sendCalls(config, parameters),
    retry: false,
  })
  return {
    ...mutation,
    sendCalls: mutation.mutate,
    sendCallsAsync: mutation.mutateAsync,
  }
}
