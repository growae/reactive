import type { Config } from '@growae/reactive'
import { createMemo, useContext } from 'solid-js'
import type { Accessor } from 'solid-js'
import { ReactiveContext } from '../context'
import { ReactiveProviderNotFoundError } from '../errors/context'

export type UseConfigParameters = Accessor<{ config?: Config | undefined }>

export type UseConfigReturnType = Accessor<Config>

export function useConfig(
  parameters: UseConfigParameters = () => ({}),
): UseConfigReturnType {
  return createMemo(() => {
    const config = parameters().config ?? useContext(ReactiveContext)
    if (!config) throw new ReactiveProviderNotFoundError()
    return config
  })
}
