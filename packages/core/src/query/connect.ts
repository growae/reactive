import type { MutationOptions } from '@tanstack/query-core'
import {
  type ConnectErrorType,
  type ConnectParameters,
  type ConnectReturnType,
  connect,
} from '../actions/connect.js'
import type { Config } from '../createConfig.js'

export function connectMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: ConnectParameters) => {
      return connect(config, variables)
    },
    mutationKey: ['connect'],
  } satisfies MutationOptions<
    ConnectReturnType,
    ConnectErrorType,
    ConnectParameters
  >
}

export type ConnectMutationOptions = ReturnType<typeof connectMutationOptions>
export type ConnectData = ConnectReturnType
export type ConnectVariables = ConnectParameters
export type { ConnectErrorType }
