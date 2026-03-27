import { type UpdateNameParameters, updateName } from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseUpdateNameParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

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

export type UseUpdateNameReturnType = ReturnType<typeof useUpdateName>
