import type { Config } from '@reactive/core'

export type ConfigParameter<config extends Config = Config> = {
  config?: Config | config | undefined
}

export type EnabledParameter = {
  enabled?: boolean | undefined
}
