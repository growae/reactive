'use client'
import { getNamePointees } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseNamePointeesParameters = NonNullable<
  Parameters<typeof getNamePointees>[1]
> &
  QueryParameters
export type UseNamePointeesReturnType = ReturnType<typeof useNamePointees>
export function useNamePointees(parameters: UseNamePointeesParameters) {
  return useActionQuery(
    'getNamePointees',
    getNamePointees,
    parameters,
    Boolean(parameters.address),
  )
}
