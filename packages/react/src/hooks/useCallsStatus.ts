'use client'
import { type CallGroup, getCallsStatus } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export function useCallsStatus(
  p: ConfigParameter & { group?: CallGroup; enabled?: boolean } = {},
) {
  const config = useConfig(p)
  return useQuery<
    Awaited<ReturnType<typeof getCallsStatus>>,
    Error,
    Awaited<ReturnType<typeof getCallsStatus>>,
    readonly unknown[]
  >({
    queryKey: ['getCallsStatus', p.group],
    queryFn: ({ signal }) => {
      if (!p.group) throw new Error('A transaction group is required')
      return getCallsStatus(config, { group: p.group, signal })
    },
    enabled: Boolean(p.group?.hashes.length) && (p.enabled ?? true),
    retry: false,
  })
}
