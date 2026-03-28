import {
  type Config,
  type GetNameEntryErrorType,
  type GetNameEntryParameters,
  type GetNameEntryReturnType,
  getNameEntry,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { type UseQueryReturnType, useQuery } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworkId } from './useNetworkId'

export type UseNameEntryParameters = Accessor<
  GetNameEntryParameters & {
    config?: Config | undefined
    enabled?: boolean
  }
>

export type UseNameEntryReturnType = UseQueryReturnType<
  GetNameEntryReturnType,
  GetNameEntryErrorType
>

export function useNameEntry(
  parameters: UseNameEntryParameters = () => ({}) as GetNameEntryParameters,
): UseNameEntryReturnType {
  const config = useConfig(parameters)
  const networkId = useNetworkId(() => ({ config: config() }))

  const options = createMemo(() => ({
    queryKey: [
      'nameEntry',
      {
        name: parameters().name,
        networkId: parameters().networkId ?? networkId(),
      },
    ] as const,
    queryFn: () =>
      getNameEntry(config(), {
        ...parameters(),
        networkId: parameters().networkId ?? networkId(),
      }),
    enabled: Boolean(parameters().name) && (parameters().enabled ?? true),
  }))

  return useQuery(options) as UseNameEntryReturnType
}
