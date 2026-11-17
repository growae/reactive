'use client'
import { type CallGroup, waitForCallsStatus } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import { useQuery } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export function useWaitForCallsStatus(
  p: ConfigParameter & {
    group?: CallGroup
    enabled?: boolean
    interval?: number
    timeout?: number
  } = {},
) {
  const config = useConfig(p)
  return useQuery<
    Awaited<ReturnType<typeof waitForCallsStatus>>,
    Error,
    Awaited<ReturnType<typeof waitForCallsStatus>>,
    readonly unknown[]
  >({
    queryKey: ['waitForCallsStatus', p.group, p.interval, p.timeout],
    queryFn: ({ signal }) => {
      if (!p.group) throw new Error('A transaction group is required')
      return waitForCallsStatus(config, {
        group: p.group,
        signal,
        interval: p.interval,
        timeout: p.timeout,
      })
    },
    enabled: Boolean(p.group?.hashes.length) && (p.enabled ?? true),
    retry: false,
  })
}
