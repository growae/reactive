'use client'
import { getMinimumFee } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseMinimumFeeParameters = NonNullable<
  Parameters<typeof getMinimumFee>[1]
> &
  QueryParameters
export type UseMinimumFeeReturnType = ReturnType<typeof useMinimumFee>
export function useMinimumFee(parameters: UseMinimumFeeParameters) {
  return useActionQuery(
    'getMinimumFee',
    getMinimumFee,
    parameters,
    Boolean(parameters.tag),
  )
}
