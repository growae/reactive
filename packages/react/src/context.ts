'use client'

import type { Config, State } from '@growae/reactive'
import { createContext, createElement } from 'react'
import { Hydrate } from './hydrate'

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
