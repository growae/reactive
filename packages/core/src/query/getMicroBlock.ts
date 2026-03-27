import {
  type GetMicroBlockErrorType,
  type GetMicroBlockParameters,
  type GetMicroBlockReturnType,
  getMicroBlock,
} from '../actions/getMicroBlock.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type GetMicroBlockOptions = ExactPartial<GetMicroBlockParameters>

export function getMicroBlockQueryKey(params: GetMicroBlockOptions = {}) {
  return ['getMicroBlock', params] as const
}

export type GetMicroBlockQueryKey = ReturnType<typeof getMicroBlockQueryKey>

export function getMicroBlockQueryOptions(
  config: Config,
  params: GetMicroBlockOptions = {},
) {
  return {
    enabled: Boolean(params.hash),
    queryFn: async () => {
      if (!params.hash) throw new Error('hash is required')
      return getMicroBlock(config, params as GetMicroBlockParameters)
    },
    queryKey: getMicroBlockQueryKey(params),
  }
}

export type GetMicroBlockQueryFnData = GetMicroBlockReturnType
export type GetMicroBlockData = GetMicroBlockQueryFnData
export type { GetMicroBlockErrorType }
