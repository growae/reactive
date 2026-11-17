'use client'
import { watchBlocks } from '@growae/reactive'
import { useEffect, useRef } from 'react'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseWatchBlocksParameters = Parameters<typeof watchBlocks>[1] &
  ConfigParameter & { enabled?: boolean }
export function useWatchBlocks(parameters: UseWatchBlocksParameters) {
  const config = useConfig(parameters)
  const activeNetwork = useNetworkId({ config })
  const networkId = parameters.networkId ?? activeNetwork
  const { enabled = true, interval, emitOnBegin } = parameters
  const callbacks = useRef(parameters)
  callbacks.current = parameters
  useEffect(() => {
    if (!enabled) return
    return watchBlocks(config, {
      networkId,
      interval,
      emitOnBegin,
      onBlock: (block, previous) => callbacks.current.onBlock(block, previous),
      onError: (e) => callbacks.current.onError?.(e),
    })
  }, [config, enabled, networkId, interval, emitOnBegin])
}
