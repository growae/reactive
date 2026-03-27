'use client'

import { hydrate } from '@reactive/core'
import type { Config, State } from '@reactive/core'
import { type ReactElement, useEffect, useRef } from 'react'

export type HydrateProps = {
  config: Config
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
}

export function Hydrate(parameters: React.PropsWithChildren<HydrateProps>) {
  const { children, config, initialState, reconnectOnMount = true } = parameters

  const { onMount } = hydrate(config, {
    initialState,
    reconnectOnMount,
  })

  if (!config._internal.ssr) onMount()

  const active = useRef(true)
  useEffect(() => {
    if (!active.current) return
    if (!config._internal.ssr) return
    onMount()
    return () => {
      active.current = false
    }
  }, [])

  return children as ReactElement
}
