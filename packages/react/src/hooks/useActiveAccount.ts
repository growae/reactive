'use client'

import {
  type GetActiveAccountReturnType,
  getActiveAccount,
  watchActiveAccount,
} from '@growae/reactive'
import { useSyncExternalStore } from 'react'
import type { ConfigParameter } from '../types/properties'
import { useConfig } from './useConfig'

export type UseActiveAccountParameters = ConfigParameter

export type UseActiveAccountReturnType = GetActiveAccountReturnType

export function useActiveAccount(
  parameters: UseActiveAccountParameters = {},
): UseActiveAccountReturnType {
  const config = useConfig(parameters)

  return useSyncExternalStore(
    (onChange) =>
      watchActiveAccount(config, {
        onChange: () => onChange(),
      }),
    () => getActiveAccount(config),
    () => getActiveAccount(config),
  )
}
