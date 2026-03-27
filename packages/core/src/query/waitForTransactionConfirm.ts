import { type WaitForTransactionConfirmErrorType, type WaitForTransactionConfirmParameters, type WaitForTransactionConfirmReturnType, waitForTransactionConfirm } from '../actions/waitForTransactionConfirm.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type WaitForTransactionConfirmOptions = ExactPartial<WaitForTransactionConfirmParameters>

export function waitForTransactionConfirmQueryKey(params: WaitForTransactionConfirmOptions = {}) {
  return ['waitForTransactionConfirm', params] as const
}
export type WaitForTransactionConfirmQueryKey = ReturnType<typeof waitForTransactionConfirmQueryKey>

export function waitForTransactionConfirmQueryOptions(config: Config, params: WaitForTransactionConfirmOptions = {}) {
  return {
    enabled: Boolean(params.hash),
    queryFn: async () => {
      if (!params.hash) throw new Error('hash is required')
      return waitForTransactionConfirm(config, params as WaitForTransactionConfirmParameters)
    },
    queryKey: waitForTransactionConfirmQueryKey(params),
  }
}

export type WaitForTransactionConfirmQueryFnData = WaitForTransactionConfirmReturnType
export type WaitForTransactionConfirmData = WaitForTransactionConfirmQueryFnData
export { type WaitForTransactionConfirmErrorType }
