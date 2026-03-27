import {
  type GetBalanceErrorType,
  type GetBalanceParameters,
  type GetBalanceReturnType,
  getBalance,
} from '../actions/getBalance.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type GetBalanceOptions = ExactPartial<GetBalanceParameters>

export function getBalanceQueryKey(params: GetBalanceOptions = {}) {
  return ['getBalance', params] as const
}

export type GetBalanceQueryKey = ReturnType<typeof getBalanceQueryKey>

export function getBalanceQueryOptions(
  config: Config,
  params: GetBalanceOptions = {},
) {
  return {
    enabled: Boolean(params.address),
    queryFn: async () => {
      if (!params.address) throw new Error('address is required')
      return getBalance(config, params as GetBalanceParameters)
    },
    queryKey: getBalanceQueryKey(params),
  }
}

export type GetBalanceQueryFnData = GetBalanceReturnType
export type GetBalanceData = GetBalanceQueryFnData
export { type GetBalanceErrorType }
