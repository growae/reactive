'use client'

import type { Config, State } from '@reactive/core'
import { createContext, createElement, type ReactNode } from 'react'
import { Hydrate } from './hydrate.js'

export const ReactiveContext = createContext<Config | undefined>(undefined)

export type ReactiveProviderProps = {
  config: Config
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
}

export function ReactiveProvider(
  parameters: React.PropsWithChildren<ReactiveProviderProps>,
) {
  const { children, config } = parameters
  const props = { value: config }
  return createElement(
    Hydrate,
    parameters,
    createElement(ReactiveContext.Provider, props, children),
  )
}
