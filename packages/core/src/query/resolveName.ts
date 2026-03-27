import {
  type ResolveNameErrorType,
  type ResolveNameParameters,
  type ResolveNameReturnType,
  resolveName,
} from '../actions/resolveName.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type ResolveNameOptions = ExactPartial<ResolveNameParameters>

export function resolveNameQueryKey(params: ResolveNameOptions = {}) {
  return ['resolveName', params] as const
}

export type ResolveNameQueryKey = ReturnType<typeof resolveNameQueryKey>

export function resolveNameQueryOptions(
  config: Config,
  params: ResolveNameOptions = {},
) {
  return {
    enabled: Boolean(params.name),
    queryFn: async () => {
      if (!params.name) throw new Error('name is required')
      return resolveName(config, params as ResolveNameParameters)
    },
    queryKey: resolveNameQueryKey(params),
  }
}

export type ResolveNameQueryFnData = ResolveNameReturnType
export type ResolveNameData = ResolveNameQueryFnData
export type { ResolveNameErrorType }
