import type { Config } from '@growae/reactive'

export type ConfigParameter<config extends Config = Config> = {
  config?: Config | config | undefined
}

export type EnabledParameter = {
  enabled?: boolean | undefined
}
