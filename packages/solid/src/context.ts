import type { Config, State } from '@growae/reactive'
import {
  type ParentProps,
  createComponent,
  createContext,
  mergeProps,
} from 'solid-js'
import { Hydrate } from './hydrate.js'

export const ReactiveContext = createContext<Config | undefined>(undefined)

export type ReactiveProviderProps = {
  config: Config
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
}

export function ReactiveProvider(
  parameters: ParentProps<ReactiveProviderProps>,
) {
  const props = mergeProps({ reconnectOnMount: true }, parameters)
  return createComponent(Hydrate, {
    get config() {
      return props.config
    },
    get initialState() {
      return props.initialState
    },
    get reconnectOnMount() {
      return props.reconnectOnMount
    },
    get children() {
      return createComponent(ReactiveContext.Provider, {
        get value() {
          return props.config
        },
        get children() {
          return props.children
        },
      })
    },
  })
}
