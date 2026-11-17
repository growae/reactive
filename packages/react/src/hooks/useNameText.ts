'use client'
import { getNameText } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseNameTextParameters = NonNullable<
  Parameters<typeof getNameText>[1]
> &
  QueryParameters
export type UseNameTextReturnType = ReturnType<typeof useNameText>
export function useNameText(parameters: UseNameTextParameters) {
  return useActionQuery(
    'getNameText',
    getNameText,
    parameters,
    Boolean(parameters.name && parameters.key),
  )
}
