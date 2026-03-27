'use client'

import { watchHeight } from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useEffect, useRef } from 'react'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseWatchHeightParameters = Compute<
  ConfigParameter & {
    onHeight: (height: number) => void
    onError?: (error: Error) => void
    enabled?: boolean
    interval?: number
    networkId?: string
  }
>

export type UseWatchHeightReturnType = void

export function useWatchHeight(
  parameters: UseWatchHeightParameters,
): UseWatchHeightReturnType {
  const { enabled = true, interval, networkId: paramNetworkId } = parameters
  const config = useConfig(parameters)
  const configNetworkId = useNetworkId({ config })
  const networkId = paramNetworkId ?? configNetworkId

  const onHeightRef = useRef(parameters.onHeight)
  const onErrorRef = useRef(parameters.onError)
  onHeightRef.current = parameters.onHeight
  onErrorRef.current = parameters.onError

  useEffect(() => {
    if (!enabled) return
    if (!onHeightRef.current) return
    return watchHeight(config, {
      onChange: (height) => onHeightRef.current?.(height),
      onError: (error) => onErrorRef.current?.(error),
      interval,
      networkId,
    })
  }, [config, enabled, interval, networkId])
}
