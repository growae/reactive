import {
  type WaitForTransactionErrorType,
  type WaitForTransactionParameters,
  type WaitForTransactionReturnType,
  waitForTransaction,
} from '../actions/waitForTransaction.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type WaitForTransactionOptions =
  ExactPartial<WaitForTransactionParameters>

export function waitForTransactionQueryKey(
  params: WaitForTransactionOptions = {},
) {
  return ['waitForTransaction', params] as const
}

export type WaitForTransactionQueryKey = ReturnType<
  typeof waitForTransactionQueryKey
>

export function waitForTransactionQueryOptions(
  config: Config,
  params: WaitForTransactionOptions = {},
) {
  return {
    enabled: Boolean(params.hash),
    queryFn: async () => {
      if (!params.hash) throw new Error('hash is required')
      return waitForTransaction(config, params as WaitForTransactionParameters)
    },
    queryKey: waitForTransactionQueryKey(params),
  }
}

export type WaitForTransactionQueryFnData = WaitForTransactionReturnType
export type WaitForTransactionData = WaitForTransactionQueryFnData
export type { WaitForTransactionErrorType }
