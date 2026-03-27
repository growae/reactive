import {
  type GetTransactionErrorType,
  type GetTransactionParameters,
  type GetTransactionReturnType,
  getTransaction,
} from '../actions/getTransaction.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type GetTransactionOptions = ExactPartial<GetTransactionParameters>

export function getTransactionQueryKey(params: GetTransactionOptions = {}) {
  return ['getTransaction', params] as const
}

export type GetTransactionQueryKey = ReturnType<typeof getTransactionQueryKey>

export function getTransactionQueryOptions(
  config: Config,
  params: GetTransactionOptions = {},
) {
  return {
    enabled: Boolean(params.hash),
    queryFn: async () => {
      if (!params.hash) throw new Error('hash is required')
      return getTransaction(config, params as GetTransactionParameters)
    },
    queryKey: getTransactionQueryKey(params),
  }
}

export type GetTransactionQueryFnData = GetTransactionReturnType
export type GetTransactionData = GetTransactionQueryFnData
export type { GetTransactionErrorType }
