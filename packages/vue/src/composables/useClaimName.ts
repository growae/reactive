import type {
  ClaimNameParameters,
  ClaimNameReturnType,
  Compute,
} from '@growae/reactive'
import { claimName } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

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
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['claimName'],
    mutationFn: (variables: ClaimNameParameters) =>
      claimName(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseClaimNameReturnType<context>
  return {
    ...(mutation as unknown as Return),
    claimName: mutation.mutate as Return['claimName'],
    claimNameAsync: mutation.mutateAsync as Return['claimNameAsync'],
  }
}
