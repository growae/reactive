import type {
  Compute,
  PreclaimNameParameters,
  PreclaimNameReturnType,
} from '@growae/reactive'
import { preclaimName } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UsePreclaimNameParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: PreclaimNameReturnType,
        variables: PreclaimNameParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: PreclaimNameParameters,
        context: context,
      ) => void
      onSettled?: (
        data: PreclaimNameReturnType | undefined,
        error: Error | null,
        variables: PreclaimNameParameters,
        context: context,
      ) => void
    }
  }
>

export type UsePreclaimNameReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    PreclaimNameReturnType,
    Error,
    PreclaimNameParameters,
    context
  > & {
    preclaimName: (variables: PreclaimNameParameters) => void
    preclaimNameAsync: (
      variables: PreclaimNameParameters,
    ) => Promise<PreclaimNameReturnType>
  }
>

export function usePreclaimName<context = unknown>(
  parameters: UsePreclaimNameParameters<context> = {},
): UsePreclaimNameReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['preclaimName'],
    mutationFn: (variables: PreclaimNameParameters) =>
      preclaimName(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UsePreclaimNameReturnType<context>
  return {
    ...(mutation as unknown as Return),
    preclaimName: mutation.mutate as Return['preclaimName'],
    preclaimNameAsync: mutation.mutateAsync as Return['preclaimNameAsync'],
  }
}
