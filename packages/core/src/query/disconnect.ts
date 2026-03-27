import type { MutationOptions } from '@tanstack/query-core'
import {
  type DisconnectErrorType,
  type DisconnectParameters,
  type DisconnectReturnType,
  disconnect,
} from '../actions/disconnect'
import type { Config } from '../createConfig'

export function disconnectMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: DisconnectParameters) => {
      return disconnect(config, variables)
    },
    mutationKey: ['disconnect'],
  } satisfies MutationOptions<
    DisconnectReturnType,
    DisconnectErrorType,
    DisconnectParameters
  >
}

export type DisconnectMutationOptions = ReturnType<
  typeof disconnectMutationOptions
>
export type DisconnectData = DisconnectReturnType
export type DisconnectVariables = DisconnectParameters
export type { DisconnectErrorType }
