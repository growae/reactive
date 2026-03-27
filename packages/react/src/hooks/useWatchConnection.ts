'use client'

import { watchConnection } from '@growae/reactive'
import type { Compute, Connection } from '@growae/reactive'
import { useEffect, useRef } from 'react'
import type { ConfigParameter } from '../types/properties'
import { useConfig } from './useConfig'

export type UseWatchConnectionParameters = Compute<
  ConfigParameter & {
    onChange: (connection: Connection | undefined) => void
    enabled?: boolean
  }
>

export type UseWatchConnectionReturnType = void

export function useWatchConnection(
  parameters: UseWatchConnectionParameters,
): UseWatchConnectionReturnType {
  const { enabled = true } = parameters
  const config = useConfig(parameters)

  const onChangeRef = useRef(parameters.onChange)
  onChangeRef.current = parameters.onChange

  useEffect(() => {
    if (!enabled) return
    if (!onChangeRef.current) return
    return watchConnection(config, {
      onChange: (connection) => onChangeRef.current?.(connection),
    })
  }, [config, enabled])
}
