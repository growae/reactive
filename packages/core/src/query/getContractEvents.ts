import {
  type GetContractEventsParameters,
  type GetContractEventsReturnType,
  getContractEvents,
} from '../actions/getContractEvents'
import type { Config } from '../createConfig'
import type { ExactPartial } from '../types/utils'

export type GetContractEventsOptions = ExactPartial<GetContractEventsParameters>

export function getContractEventsQueryKey(
  params: GetContractEventsOptions = {},
) {
  return ['getContractEvents', params] as const
}

export type GetContractEventsQueryKey = ReturnType<
  typeof getContractEventsQueryKey
>

export function getContractEventsQueryOptions(
  config: Config,
  params: GetContractEventsOptions = {},
) {
  return {
    enabled: Boolean(params.address),
    queryFn: async () => {
      if (!params.address) throw new Error('address is required')
      return getContractEvents(config, params as GetContractEventsParameters)
    },
    queryKey: getContractEventsQueryKey(params),
  }
}

export type GetContractEventsQueryFnData = GetContractEventsReturnType
export type GetContractEventsData = GetContractEventsQueryFnData
