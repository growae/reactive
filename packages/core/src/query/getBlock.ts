import {
  type GetBlockErrorType,
  type GetBlockParameters,
  type GetBlockReturnType,
  getBlock,
} from '../actions/getBlock.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type GetBlockOptions = ExactPartial<GetBlockParameters>

export function getBlockQueryKey(params: GetBlockOptions = {}) {
  return ['getBlock', params] as const
}

export type GetBlockQueryKey = ReturnType<typeof getBlockQueryKey>

export function getBlockQueryOptions(
  config: Config,
  params: GetBlockOptions = {},
) {
  return {
    queryFn: async () => {
      return getBlock(config, params as GetBlockParameters)
    },
    queryKey: getBlockQueryKey(params),
  }
}

export type GetBlockQueryFnData = GetBlockReturnType
export type GetBlockData = GetBlockQueryFnData
export type { GetBlockErrorType }
