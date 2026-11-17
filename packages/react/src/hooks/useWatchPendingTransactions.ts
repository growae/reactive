'use client'
import { watchPendingTransactions } from '@growae/reactive'
import { useEffect, useRef } from 'react'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseWatchPendingTransactionsParameters = Parameters<
  typeof watchPendingTransactions
>[1] &
  ConfigParameter & { enabled?: boolean }
export function useWatchPendingTransactions(
  parameters: UseWatchPendingTransactionsParameters,
) {
  const config = useConfig(parameters)
  const activeNetwork = useNetworkId({ config })
  const networkId = parameters.networkId ?? activeNetwork
  const { enabled = true, interval, address, emitOnBegin } = parameters
  const callbacks = useRef(parameters)
  callbacks.current = parameters
  useEffect(() => {
    if (!enabled || !address) return
    return watchPendingTransactions(config, {
      networkId,
      interval,
      address,
      emitOnBegin,
      onTransactions: (hashes) => callbacks.current.onTransactions(hashes),
      onError: (e) => callbacks.current.onError?.(e),
    })
  }, [config, enabled, networkId, interval, address, emitOnBegin])
}
