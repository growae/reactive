'use client'

import {
  type GetNodeClientParameters,
  type GetNodeClientReturnType,
  getNodeClient,
  watchNodeClient,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useSyncExternalStore } from 'react'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseNodeClientParameters = Compute<
  GetNodeClientParameters & ConfigParameter
>

export type UseNodeClientReturnType = GetNodeClientReturnType

export function useNodeClient(
  parameters: UseNodeClientParameters = {},
): UseNodeClientReturnType {
  const config = useConfig(parameters)

  return useSyncExternalStore(
    (onChange) => watchNodeClient(config, { onChange }),
    () => getNodeClient(config, parameters),
    () => getNodeClient(config, parameters),
  )
}
