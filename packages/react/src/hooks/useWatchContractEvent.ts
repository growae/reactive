'use client'
import { watchContractEvent } from '@growae/reactive'
import { useEffect, useRef } from 'react'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseWatchContractEventParameters = Parameters<
  typeof watchContractEvent
>[1] &
  ConfigParameter & { enabled?: boolean }
export function useWatchContractEvent(
  parameters: UseWatchContractEventParameters,
) {
  const config = useConfig(parameters)
  const activeNetwork = useNetworkId({ config })
  const networkId = parameters.networkId ?? activeNetwork
  const { enabled = true, interval, address, event, fromHeight } = parameters
  const callbacks = useRef(parameters)
  callbacks.current = parameters
  useEffect(() => {
    if (!enabled || !address) return
    return watchContractEvent(config, {
      networkId,
      interval,
      address,
      event,
      fromHeight,
      onLogs: (events) => callbacks.current.onLogs(events),
      onError: (e) => callbacks.current.onError?.(e),
    })
  }, [config, enabled, networkId, interval, address, event, fromHeight])
}
