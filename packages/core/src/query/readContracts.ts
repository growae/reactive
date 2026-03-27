import {
  type ReadContractsParameters,
  type ReadContractsReturnType,
  readContracts,
} from '../actions/readContracts.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type ReadContractsOptions = ExactPartial<ReadContractsParameters>

export function readContractsQueryKey(params: ReadContractsOptions = {}) {
  return ['readContracts', params] as const
}

export type ReadContractsQueryKey = ReturnType<typeof readContractsQueryKey>

export function readContractsQueryOptions(
  config: Config,
  params: ReadContractsOptions = {},
) {
  return {
    enabled: Boolean(params.contracts?.length),
    queryFn: async () => {
      if (!params.contracts?.length) throw new Error('contracts is required')
      return readContracts(config, params as ReadContractsParameters)
    },
    queryKey: readContractsQueryKey(params),
  }
}

export type ReadContractsQueryFnData = ReadContractsReturnType
export type ReadContractsData = ReadContractsQueryFnData
