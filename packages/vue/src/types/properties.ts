import type { Config } from '@growae/reactive'
import type { MaybeRef } from 'vue'

export type ConfigParameter<config extends Config = Config> = {
  config?: Config | config | undefined
}

export type EnabledParameter = {
  enabled?: MaybeRef<boolean> | undefined
}
