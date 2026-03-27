import type { MutationOptions } from '@tanstack/query-core'
import {
  type CallContractErrorType,
  type CallContractParameters,
  type CallContractReturnType,
  callContract,
} from '../actions/callContract.js'
import type { Config } from '../createConfig.js'

export function callContractMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: CallContractParameters) => {
      return callContract(config, variables)
    },
    mutationKey: ['callContract'],
  } satisfies MutationOptions<CallContractReturnType, CallContractErrorType, CallContractParameters>
}

export type CallContractMutationOptions = ReturnType<
  typeof callContractMutationOptions
>
export type CallContractData = CallContractReturnType
export type CallContractVariables = CallContractParameters
export { type CallContractErrorType }
