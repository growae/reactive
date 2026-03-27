import {
  type ReadContractParameters,
  type ReadContractReturnType,
  readContract,
} from '../actions/readContract'
import type { Config } from '../createConfig'
import type { ExactPartial } from '../types/utils'

export type ReadContractOptions = ExactPartial<ReadContractParameters>

export function readContractQueryKey(params: ReadContractOptions = {}) {
  return ['readContract', params] as const
}

export type ReadContractQueryKey = ReturnType<typeof readContractQueryKey>

export function readContractQueryOptions(
  config: Config,
  params: ReadContractOptions = {},
) {
  return {
    enabled: Boolean(params.address && params.aci && params.method),
    queryFn: async () => {
      if (!params.address) throw new Error('address is required')
      if (!params.aci) throw new Error('aci is required')
      if (!params.method) throw new Error('method is required')
      return readContract(config, params as ReadContractParameters)
    },
    queryKey: readContractQueryKey(params),
  }
}

export type ReadContractQueryFnData = ReadContractReturnType
export type ReadContractData = ReadContractQueryFnData
