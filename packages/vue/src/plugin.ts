import type { Config, State } from '@reactive/core'
import { hydrate } from '@reactive/core'
import type { InjectionKey, Plugin } from 'vue'

export const configKey = Symbol('reactive-config') as InjectionKey<Config>

export type ReactivePluginOptions = {
  config: Config
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
}

export const ReactivePlugin = {
  install(app, options) {
    const { config, reconnectOnMount = true } = options
    app.provide(configKey, config)
    const { onMount } = hydrate(config, { ...options, reconnectOnMount })
    onMount()
  },
} satisfies Plugin<ReactivePluginOptions>
