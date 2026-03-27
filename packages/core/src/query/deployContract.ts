import type { MutationOptions } from '@tanstack/query-core'
import {
  type DeployContractErrorType,
  type DeployContractParameters,
  type DeployContractReturnType,
  deployContract,
} from '../actions/deployContract.js'
import type { Config } from '../createConfig.js'

export function deployContractMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: DeployContractParameters) => {
      return deployContract(config, variables)
    },
    mutationKey: ['deployContract'],
  } satisfies MutationOptions<
    DeployContractReturnType,
    DeployContractErrorType,
    DeployContractParameters
  >
}

export type DeployContractMutationOptions = ReturnType<
  typeof deployContractMutationOptions
>
export type DeployContractData = DeployContractReturnType
export type DeployContractVariables = DeployContractParameters
export type { DeployContractErrorType }
