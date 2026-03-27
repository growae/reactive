import {
  type GetTransactionCountErrorType,
  type GetTransactionCountParameters,
  type GetTransactionCountReturnType,
  getTransactionCount,
} from '../actions/getTransactionCount'
import type { Config } from '../createConfig'
import type { ExactPartial } from '../types/utils'

export type GetTransactionCountOptions =
  ExactPartial<GetTransactionCountParameters>

export function getTransactionCountQueryKey(
  params: GetTransactionCountOptions = {},
) {
  return ['getTransactionCount', params] as const
}

export type GetTransactionCountQueryKey = ReturnType<
  typeof getTransactionCountQueryKey
>

export function getTransactionCountQueryOptions(
  config: Config,
  params: GetTransactionCountOptions = {},
) {
  return {
    enabled: Boolean(params.address),
    queryFn: async () => {
      if (!params.address) throw new Error('address is required')
      return getTransactionCount(
        config,
        params as GetTransactionCountParameters,
      )
    },
    queryKey: getTransactionCountQueryKey(params),
  }
}

export type GetTransactionCountQueryFnData = GetTransactionCountReturnType
export type GetTransactionCountData = GetTransactionCountQueryFnData
export type { GetTransactionCountErrorType }
