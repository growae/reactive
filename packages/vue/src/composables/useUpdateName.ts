import type {
  Compute,
  UpdateNameParameters,
  UpdateNameReturnType,
} from '@growae/reactive'
import { updateName } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

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
      onSettled?: (
        data: UpdateNameReturnType | undefined,
        error: Error | null,
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

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['updateName'],
    mutationFn: (variables: UpdateNameParameters) =>
      updateName(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseUpdateNameReturnType<context>
  return {
    ...(mutation as unknown as Return),
    updateName: mutation.mutate as Return['updateName'],
    updateNameAsync: mutation.mutateAsync as Return['updateNameAsync'],
  }
}
