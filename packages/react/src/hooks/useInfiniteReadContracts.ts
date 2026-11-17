'use client'
import { type ContractRead, readContracts } from '@growae/reactive'
import { hashFn } from '@growae/reactive/query'
import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import { useConfig } from './useConfig.js'
import { useNetworkId } from './useNetworkId.js'

export type UseInfiniteReadContractsParameters<Cursor> = ConfigParameter & {
  cacheKey: readonly unknown[]
  initialPageParam: Cursor
  contracts: (cursor: Cursor) => readonly ContractRead[]
  getNextPageParam: (
    lastPage: string[],
    pages: string[][],
    lastCursor: Cursor,
  ) => Cursor | undefined
  networkId?: string
  top?: string
  enabled?: boolean
}
export function useInfiniteReadContracts<Cursor>(
  p: UseInfiniteReadContractsParameters<Cursor>,
) {
  const config = useConfig(p)
  const activeNetwork = useNetworkId({ config })
  const networkId = p.networkId ?? activeNetwork
  return useInfiniteQuery<
    string[],
    Error,
    InfiniteData<string[], Cursor>,
    readonly unknown[],
    Cursor
  >({
    queryKey: [
      'infiniteReadContracts',
      {
        networkId,
        top: p.top,
        initialPageParam: p.initialPageParam,
        cacheKey: p.cacheKey,
      },
    ],
    queryKeyHashFn: hashFn,
    initialPageParam: p.initialPageParam,
    queryFn: ({ pageParam }) =>
      readContracts(config, {
        contracts: p.contracts(pageParam as Cursor),
        networkId,
        top: p.top,
      }),
    getNextPageParam: p.getNextPageParam,
    enabled: p.enabled ?? true,
  })
}
