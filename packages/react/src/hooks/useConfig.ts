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
  // biome-ignore lint/correctness/useHookAtTopLevel: pre-existing conditional useContext call, flagged by the biome 2.x upgrade — needs a Core Engineer fix, not touched here
  const config = parameters.config ?? useContext(ReactiveContext)
  if (!config) throw new ReactiveProviderNotFoundError()
  return config as UseConfigReturnType<config>
}
