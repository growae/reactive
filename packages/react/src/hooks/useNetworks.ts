'use client'

import {
  type GetNetworksReturnType,
  getNetworks,
} from '@reactive/core'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseNetworksParameters = ConfigParameter

export type UseNetworksReturnType = GetNetworksReturnType

export function useNetworks(
  parameters: UseNetworksParameters = {},
): UseNetworksReturnType {
  const config = useConfig(parameters)
  return getNetworks(config)
}
