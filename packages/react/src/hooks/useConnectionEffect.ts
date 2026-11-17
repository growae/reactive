'use client'
import {
  type ConnectionEffectParameters,
  watchConnectionEffect,
} from '@growae/reactive'
import { useEffect, useRef } from 'react'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'

export type UseConnectionEffectParameters = ConnectionEffectParameters &
  ConfigParameter
export function useConnectionEffect(
  parameters: UseConnectionEffectParameters = {},
) {
  const config = useConfig(parameters)
  const callbacks = useRef(parameters)
  callbacks.current = parameters
  useEffect(
    () =>
      watchConnectionEffect(config, {
        onConnect: (connection) => callbacks.current.onConnect?.(connection),
        onDisconnect: () => callbacks.current.onDisconnect?.(),
      }),
    [config],
  )
}
