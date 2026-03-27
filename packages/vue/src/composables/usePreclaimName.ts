import type {
  Compute,
  PreclaimNameParameters,
  PreclaimNameReturnType,
} from '@growae/reactive'
import { preclaimName } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties.js'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

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
    ...mutationRest
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['preclaimName'],
    mutationFn: (variables: PreclaimNameParameters) =>
      preclaimName(config, variables),
    ...mutationRest,
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
    }),
  })

  type Return = UsePreclaimNameReturnType<context>
  return {
    ...(mutation as unknown as Return),
    preclaimName: mutation.mutate as Return['preclaimName'],
    preclaimNameAsync: mutation.mutateAsync as Return['preclaimNameAsync'],
  }
}
