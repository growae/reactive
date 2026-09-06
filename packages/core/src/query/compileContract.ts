import type { MutationOptions } from '@tanstack/query-core'
import {
  type CompileContractErrorType,
  type CompileContractParameters,
  type CompileContractReturnType,
  compileContract,
} from '../actions/compileContract.js'
import type { Config } from '../createConfig.js'

export function compileContractMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: CompileContractParameters) => {
      return compileContract(config, variables)
    },
    mutationKey: ['compileContract'],
  } satisfies MutationOptions<
    CompileContractReturnType,
    CompileContractErrorType,
    CompileContractParameters
  >
}

export type CompileContractMutationOptions = ReturnType<
  typeof compileContractMutationOptions
>
export type CompileContractData = CompileContractReturnType
export type CompileContractVariables = CompileContractParameters
export type { CompileContractErrorType }
