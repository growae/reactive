'use client'
import { getTokenMetadata } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseTokenMetadataParameters = NonNullable<
  Parameters<typeof getTokenMetadata>[1]
> &
  QueryParameters
export type UseTokenMetadataReturnType = ReturnType<typeof useTokenMetadata>
export function useTokenMetadata(parameters: UseTokenMetadataParameters) {
  return useActionQuery(
    'getTokenMetadata',
    getTokenMetadata,
    parameters,
    Boolean(parameters.token),
  )
}
