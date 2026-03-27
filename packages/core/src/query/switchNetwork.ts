import type { MutationOptions } from '@tanstack/query-core'
import {
  type SwitchNetworkErrorType,
  type SwitchNetworkParameters,
  type SwitchNetworkReturnType,
  switchNetwork,
} from '../actions/switchNetwork.js'
import type { Config } from '../createConfig.js'

export function switchNetworkMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: SwitchNetworkParameters) => {
      return switchNetwork(config, variables)
    },
    mutationKey: ['switchNetwork'],
  } satisfies MutationOptions<SwitchNetworkReturnType, SwitchNetworkErrorType, SwitchNetworkParameters>
}

export type SwitchNetworkMutationOptions = ReturnType<
  typeof switchNetworkMutationOptions
>
export type SwitchNetworkData = SwitchNetworkReturnType
export type SwitchNetworkVariables = SwitchNetworkParameters
export { type SwitchNetworkErrorType }
