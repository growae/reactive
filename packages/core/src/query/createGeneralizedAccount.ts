import type { MutationOptions } from '@tanstack/query-core'
import {
  type CreateGeneralizedAccountParameters,
  type CreateGeneralizedAccountReturnType,
  createGeneralizedAccount,
} from '../actions/ga/createGeneralizedAccount.js'
import type { Config } from '../createConfig.js'

export type CreateGeneralizedAccountErrorType = Error

export function createGeneralizedAccountMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: CreateGeneralizedAccountParameters) => {
      return createGeneralizedAccount(config, variables)
    },
    mutationKey: ['createGeneralizedAccount'],
  } satisfies MutationOptions<CreateGeneralizedAccountReturnType, CreateGeneralizedAccountErrorType, CreateGeneralizedAccountParameters>
}

export type CreateGeneralizedAccountMutationOptions = ReturnType<typeof createGeneralizedAccountMutationOptions>
export type CreateGeneralizedAccountData = CreateGeneralizedAccountReturnType
export type CreateGeneralizedAccountVariables = CreateGeneralizedAccountParameters
