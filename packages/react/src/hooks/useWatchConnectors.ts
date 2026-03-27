'use client'

import { watchConnectors } from '@growae/reactive'
import type { Compute, Connector } from '@growae/reactive'
import { useEffect, useRef } from 'react'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseWatchConnectorsParameters = Compute<
  ConfigParameter & {
    onChange: (connectors: readonly Connector[]) => void
    enabled?: boolean
  }
>

export type UseWatchConnectorsReturnType = void

export function useWatchConnectors(
  parameters: UseWatchConnectorsParameters,
): UseWatchConnectorsReturnType {
  const { enabled = true } = parameters
  const config = useConfig(parameters)

  const onChangeRef = useRef(parameters.onChange)
  onChangeRef.current = parameters.onChange

  useEffect(() => {
    if (!enabled) return
    if (!onChangeRef.current) return
    return watchConnectors(config, {
      onChange: (connectors) => onChangeRef.current?.(connectors),
    })
  }, [config, enabled])
}
