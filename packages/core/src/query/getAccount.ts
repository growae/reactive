import {
  type GetAccountErrorType,
  type GetAccountParameters,
  type GetAccountReturnType,
  getAccount,
} from '../actions/getAccount.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type GetAccountOptions = ExactPartial<GetAccountParameters>

export function getAccountQueryKey(params: GetAccountOptions = {}) {
  return ['getAccount', params] as const
}

export type GetAccountQueryKey = ReturnType<typeof getAccountQueryKey>

export function getAccountQueryOptions(
  config: Config,
  params: GetAccountOptions = {},
) {
  return {
    enabled: Boolean(params.address),
    queryFn: async () => {
      if (!params.address) throw new Error('address is required')
      return getAccount(config, params as GetAccountParameters)
    },
    queryKey: getAccountQueryKey(params),
  }
}

export type GetAccountQueryFnData = GetAccountReturnType
export type GetAccountData = GetAccountQueryFnData
export type { GetAccountErrorType }
