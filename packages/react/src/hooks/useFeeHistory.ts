'use client'
import { getFeeHistory } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseFeeHistoryParameters = NonNullable<
  Parameters<typeof getFeeHistory>[1]
> &
  QueryParameters
export type UseFeeHistoryReturnType = ReturnType<typeof useFeeHistory>
export function useFeeHistory(parameters: UseFeeHistoryParameters = {}) {
  return useActionQuery('getFeeHistory', getFeeHistory, parameters)
}
