import type { MutationOptions } from '@tanstack/query-core'
import {
  type ReconnectErrorType,
  type ReconnectParameters,
  type ReconnectReturnType,
  reconnect,
} from '../actions/reconnect.js'
import type { Config } from '../createConfig.js'

export function reconnectMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: ReconnectParameters) => {
      return reconnect(config, variables)
    },
    mutationKey: ['reconnect'],
  } satisfies MutationOptions<ReconnectReturnType, ReconnectErrorType, ReconnectParameters>
}

export type ReconnectMutationOptions = ReturnType<
  typeof reconnectMutationOptions
>
export type ReconnectData = ReconnectReturnType
export type ReconnectVariables = ReconnectParameters
export { type ReconnectErrorType }
