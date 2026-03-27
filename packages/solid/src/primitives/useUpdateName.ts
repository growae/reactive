import { createMutation } from '@tanstack/solid-query'
import {
  type UpdateNameParameters,
  type UpdateNameReturnType,
  updateName,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseUpdateNameParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

export function useUpdateName(
  parameters: UseUpdateNameParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['updateName'],
    mutationFn: (variables: UpdateNameParameters) =>
      updateName(config(), variables),
  }))
}
