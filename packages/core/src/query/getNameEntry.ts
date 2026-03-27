import {
  type GetNameEntryErrorType,
  type GetNameEntryParameters,
  type GetNameEntryReturnType,
  getNameEntry,
} from '../actions/getNameEntry'
import type { Config } from '../createConfig'
import type { ExactPartial } from '../types/utils'

export type GetNameEntryOptions = ExactPartial<GetNameEntryParameters>

export function getNameEntryQueryKey(params: GetNameEntryOptions = {}) {
  return ['getNameEntry', params] as const
}

export type GetNameEntryQueryKey = ReturnType<typeof getNameEntryQueryKey>

export function getNameEntryQueryOptions(
  config: Config,
  params: GetNameEntryOptions = {},
) {
  return {
    enabled: Boolean(params.name),
    queryFn: async () => {
      if (!params.name) throw new Error('name is required')
      return getNameEntry(config, params as GetNameEntryParameters)
    },
    queryKey: getNameEntryQueryKey(params),
  }
}

export type GetNameEntryQueryFnData = GetNameEntryReturnType
export type GetNameEntryData = GetNameEntryQueryFnData
export type { GetNameEntryErrorType }
