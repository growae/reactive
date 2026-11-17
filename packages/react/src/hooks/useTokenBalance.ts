'use client'
import { getTokenBalance } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseTokenBalanceParameters = NonNullable<
  Parameters<typeof getTokenBalance>[1]
> &
  QueryParameters
export type UseTokenBalanceReturnType = ReturnType<typeof useTokenBalance>
export function useTokenBalance(parameters: UseTokenBalanceParameters) {
  return useActionQuery(
    'getTokenBalance',
    getTokenBalance,
    parameters,
    Boolean(parameters.token && parameters.address),
  )
}
