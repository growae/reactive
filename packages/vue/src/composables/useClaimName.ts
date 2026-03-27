import type {
  ClaimNameParameters,
  ClaimNameReturnType,
  Compute,
} from '@growae/reactive'
import { claimName } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties.js'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseClaimNameParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: ClaimNameReturnType,
        variables: ClaimNameParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: ClaimNameParameters,
        context: context,
      ) => void
      onSettled?: (
        data: ClaimNameReturnType | undefined,
        error: Error | null,
        variables: ClaimNameParameters,
        context: context,
      ) => void
    }
  }
>

export type UseClaimNameReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    ClaimNameReturnType,
    Error,
    ClaimNameParameters,
    context
  > & {
    claimName: (variables: ClaimNameParameters) => void
    claimNameAsync: (
      variables: ClaimNameParameters,
    ) => Promise<ClaimNameReturnType>
  }
>

export function useClaimName<context = unknown>(
  parameters: UseClaimNameParameters<context> = {},
): UseClaimNameReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    ...mutationRest
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['claimName'],
    mutationFn: (variables: ClaimNameParameters) =>
      claimName(config, variables),
    ...mutationRest,
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
    }),
  })

  type Return = UseClaimNameReturnType<context>
  return {
    ...(mutation as unknown as Return),
    claimName: mutation.mutate as Return['claimName'],
    claimNameAsync: mutation.mutateAsync as Return['claimNameAsync'],
  }
}
