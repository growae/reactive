import {
  type GetHeightErrorType,
  type GetHeightParameters,
  type GetHeightReturnType,
  getHeight,
} from '../actions/getHeight'
import type { Config } from '../createConfig'
import type { ExactPartial } from '../types/utils'

export type GetHeightOptions = ExactPartial<GetHeightParameters>

export function getHeightQueryKey(params: GetHeightOptions = {}) {
  return ['getHeight', params] as const
}

export type GetHeightQueryKey = ReturnType<typeof getHeightQueryKey>

export function getHeightQueryOptions(
  config: Config,
  params: GetHeightOptions = {},
) {
  return {
    queryFn: async () => {
      return getHeight(config, params as GetHeightParameters)
    },
    queryKey: getHeightQueryKey(params),
  }
}

export type GetHeightQueryFnData = GetHeightReturnType
export type GetHeightData = GetHeightQueryFnData
export type { GetHeightErrorType }
