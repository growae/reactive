'use client'
import { getTokenAllowance } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'
export function useTokenAllowance(
  p: Parameters<typeof getTokenAllowance>[1] & QueryParameters,
) {
  return useActionQuery(
    'getTokenAllowance',
    getTokenAllowance,
    p,
    Boolean(p.token && p.owner && p.spender),
  )
}
