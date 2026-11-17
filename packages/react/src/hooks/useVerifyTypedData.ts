'use client'
import { verifyTypedData } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseVerifyTypedDataParameters = NonNullable<
  Parameters<typeof verifyTypedData>[1]
> &
  QueryParameters
export type UseVerifyTypedDataReturnType = ReturnType<typeof useVerifyTypedData>
export function useVerifyTypedData(parameters: UseVerifyTypedDataParameters) {
  return useActionQuery(
    'verifyTypedData',
    verifyTypedData,
    parameters,
    Boolean(parameters.address && parameters.signature && parameters.data),
  )
}
