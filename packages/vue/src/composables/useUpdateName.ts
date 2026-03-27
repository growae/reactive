import type {
  Compute,
  UpdateNameParameters,
  UpdateNameReturnType,
} from '@growae/reactive'
import { updateName } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseUpdateNameParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: UpdateNameReturnType,
        variables: UpdateNameParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: UpdateNameParameters,
        context: context,
      ) => void
    }
  }
>

export type UseUpdateNameReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    UpdateNameReturnType,
    Error,
    UpdateNameParameters,
    context
  > & {
    updateName: (variables: UpdateNameParameters) => void
    updateNameAsync: (
      variables: UpdateNameParameters,
    ) => Promise<UpdateNameReturnType>
  }
>

export function useUpdateName<context = unknown>(
  parameters: UseUpdateNameParameters<context> = {},
): UseUpdateNameReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['updateName'],
    mutationFn: (variables: UpdateNameParameters) =>
      updateName(config, variables),
    ...parameters.mutation,
  })

  type Return = UseUpdateNameReturnType<context>
  return {
    ...(mutation as unknown as Return),
    updateName: mutation.mutate as Return['updateName'],
    updateNameAsync: mutation.mutateAsync as Return['updateNameAsync'],
  }
}
