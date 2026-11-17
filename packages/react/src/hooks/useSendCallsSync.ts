'use client'
import { sendCallsSync } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export function useSendCallsSync(p: ConfigParameter = {}) {
  const config = useConfig(p)
  const mutation = useMutation({
    mutationKey: ['sendCallsSync'],
    mutationFn: (parameters: Parameters<typeof sendCallsSync>[1]) =>
      sendCallsSync(config, parameters),
    retry: false,
  })
  return {
    ...mutation,
    sendCallsSync: mutation.mutate,
    sendCallsSyncAsync: mutation.mutateAsync,
  }
}
