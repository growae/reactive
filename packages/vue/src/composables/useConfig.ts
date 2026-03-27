import type { Config } from '@growae/reactive'
import { hasInjectionContext, inject, unref } from 'vue'
import {
  ReactiveInjectionContextError,
  ReactivePluginNotFoundError,
} from '../errors/plugin'
import { configKey } from '../plugin'
import type { ConfigParameter } from '../types/properties'
import type { DeepMaybeRef } from '../types/ref'

export type UseConfigParameters<config extends Config = Config> = DeepMaybeRef<
  ConfigParameter<config>
>

export type UseConfigReturnType<config extends Config = Config> = config

export function useConfig<config extends Config = Config>(
  parameters_: UseConfigParameters<config> = {},
): UseConfigReturnType<config> {
  const parameters = unref(parameters_)

  if (parameters.config) return parameters.config as UseConfigReturnType<config>

  if (!hasInjectionContext()) throw new ReactiveInjectionContextError()

  const config = inject<Config | undefined>(configKey)
  if (!config) throw new ReactivePluginNotFoundError()

  return config as UseConfigReturnType<config>
}
