'use client'

import {
  type GetNetworkIdReturnType,
  getNetworkId,
  watchNetworkId,
} from '@reactive/core'
import { useSyncExternalStore } from 'react'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseNetworkIdParameters = ConfigParameter

export type UseNetworkIdReturnType = GetNetworkIdReturnType

export function useNetworkId(
  parameters: UseNetworkIdParameters = {},
): UseNetworkIdReturnType {
  const config = useConfig(parameters)

  return useSyncExternalStore(
    (onChange) => watchNetworkId(config, { onChange }),
    () => getNetworkId(config),
    () => getNetworkId(config),
  )
}
