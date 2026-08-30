'use client'

import type { Config } from '@growae/reactive'
import { useContext } from 'react'
import { ReactiveContext } from '../context'
import { ReactiveProviderNotFoundError } from '../errors/context'
import type { ConfigParameter } from '../types/properties'

export type UseConfigParameters<config extends Config = Config> =
  ConfigParameter<config>

export type UseConfigReturnType<config extends Config = Config> = config

export function useConfig<config extends Config = Config>(
  parameters: UseConfigParameters<config> = {},
): UseConfigReturnType<config> {
  // useContext is called unconditionally. Reading it inside `??` would skip the
  // hook whenever a config is passed explicitly, so a caller whose `config`
  // parameter changes between renders would change this component's hook count
  // and React would throw. Every hook taking an optional `config` reaches here.
  const contextConfig = useContext(ReactiveContext)
  const config = parameters.config ?? contextConfig
  if (!config) throw new ReactiveProviderNotFoundError()
  return config as UseConfigReturnType<config>
}
