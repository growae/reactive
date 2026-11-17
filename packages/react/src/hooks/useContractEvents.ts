'use client'
import { getContractEvents } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseContractEventsParameters = NonNullable<
  Parameters<typeof getContractEvents>[1]
> &
  QueryParameters
export type UseContractEventsReturnType = ReturnType<typeof useContractEvents>
export function useContractEvents(parameters: UseContractEventsParameters) {
  return useActionQuery(
    'getContractEvents',
    getContractEvents,
    parameters,
    Boolean(parameters.address),
  )
}
