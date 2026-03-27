import { type EstimateGasErrorType, type EstimateGasParameters, type EstimateGasReturnType, estimateGas } from '../actions/estimateGas.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type EstimateGasOptions = ExactPartial<EstimateGasParameters>

export function estimateGasQueryKey(params: EstimateGasOptions = {}) {
  return ['estimateGas', params] as const
}
export type EstimateGasQueryKey = ReturnType<typeof estimateGasQueryKey>

export function estimateGasQueryOptions(config: Config, params: EstimateGasOptions = {}) {
  return {
    enabled: Boolean(params.tx),
    queryFn: async () => {
      if (!params.tx) throw new Error('tx is required')
      if (!params.accountAddress) throw new Error('accountAddress is required')
      return estimateGas(config, params as EstimateGasParameters)
    },
    queryKey: estimateGasQueryKey(params),
  }
}

export type EstimateGasQueryFnData = EstimateGasReturnType
export type EstimateGasData = EstimateGasQueryFnData
export { type EstimateGasErrorType }
