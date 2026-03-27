'use client'

import type { Config } from '@reactive/core'
import { useContext } from 'react'
import { ReactiveContext } from '../context.js'
import { ReactiveProviderNotFoundError } from '../errors/context.js'
import type { ConfigParameter } from '../types/properties.js'

export type UseConfigParameters<config extends Config = Config> =
  ConfigParameter<config>

export type UseConfigReturnType<config extends Config = Config> = config

export function useConfig<config extends Config = Config>(
  parameters: UseConfigParameters<config> = {},
): UseConfigReturnType<config> {
  const config = parameters.config ?? useContext(ReactiveContext)
  if (!config) throw new ReactiveProviderNotFoundError()
  return config as UseConfigReturnType<config>
}
