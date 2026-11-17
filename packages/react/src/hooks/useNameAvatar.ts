'use client'
import { getNameAvatar } from '@growae/reactive'
import { type QueryParameters, useActionQuery } from './actionQuery.js'

export type UseNameAvatarParameters = NonNullable<
  Parameters<typeof getNameAvatar>[1]
> &
  QueryParameters
export type UseNameAvatarReturnType = ReturnType<typeof useNameAvatar>
export function useNameAvatar(parameters: UseNameAvatarParameters) {
  return useActionQuery(
    'getNameAvatar',
    getNameAvatar,
    parameters,
    Boolean(parameters.name),
  )
}
