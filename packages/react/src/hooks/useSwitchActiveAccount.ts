'use client'

import {
  type SwitchActiveAccountParameters,
  switchActiveAccount,
} from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties'
import { useConfig } from './useConfig'

export type UseSwitchActiveAccountParameters = ConfigParameter

export type UseSwitchActiveAccountReturnType = {
  switchActiveAccount: (params: SwitchActiveAccountParameters) => void
  isPending: boolean
  error: Error | null
}

export function useSwitchActiveAccount(
  parameters: UseSwitchActiveAccountParameters = {},
): UseSwitchActiveAccountReturnType {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['switchActiveAccount'],
    mutationFn: (params: SwitchActiveAccountParameters) => {
      switchActiveAccount(config, params)
      return Promise.resolve()
    },
  } as any)

  return {
    switchActiveAccount:
      mutation.mutate as unknown as UseSwitchActiveAccountReturnType['switchActiveAccount'],
    isPending: mutation.isPending,
    error: mutation.error,
  }
}
