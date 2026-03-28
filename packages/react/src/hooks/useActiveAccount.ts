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

  // Snapshot must be a primitive — returning a new object every call causes
  // useSyncExternalStore to see it as "changed" on every render → infinite loop.
  // We snapshot just the address string (or null) and derive the full object below.
  useSyncExternalStore(
    (onChange) =>
      watchActiveAccount(config, {
        onChange: () => onChange(),
      }),
    () => {
      const a = getActiveAccount(config)
      return a.isConnected ? a.address : null
    },
    () => {
      const a = getActiveAccount(config)
      return a.isConnected ? a.address : null
    },
  )

  return getActiveAccount(config)
}
