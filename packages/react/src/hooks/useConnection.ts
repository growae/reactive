'use client'

import { type GetConnectionReturnType, getConnection } from '@growae/reactive'
import { useSyncExternalStore } from 'react'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseConnectionParameters = ConfigParameter

export type UseConnectionReturnType = GetConnectionReturnType

export function useConnection(
  parameters: UseConnectionParameters = {},
): UseConnectionReturnType {
  const config = useConfig(parameters)

  return useSyncExternalStore(
    (onChange) =>
      config.subscribe(
        (state) => state.connections.get(state.current ?? ''),
        onChange,
      ),
    () => getConnection(config),
    () => getConnection(config),
  )
}
