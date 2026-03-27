'use client'

import { watchHeight } from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useEffect, useRef } from 'react'
import type { ConfigParameter } from '../types/properties'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseWatchHeightParameters = Compute<
  ConfigParameter & {
    onHeight: (height: number) => void
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
  onHeightRef.current = parameters.onHeight

  useEffect(() => {
    if (!enabled) return
    if (!onHeightRef.current) return
    return watchHeight(config, {
      onChange: (height) => onHeightRef.current?.(height),
      pollingInterval: interval,
      networkId,
    })
  }, [config, enabled, interval, networkId])
}
