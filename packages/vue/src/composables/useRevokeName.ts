import type {
  Compute,
  RevokeNameParameters,
  RevokeNameReturnType,
} from '@growae/reactive'
import { revokeName } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties.js'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseRevokeNameParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: RevokeNameReturnType,
        variables: RevokeNameParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: RevokeNameParameters,
        context: context,
      ) => void
      onSettled?: (
        data: RevokeNameReturnType | undefined,
        error: Error | null,
        variables: RevokeNameParameters,
        context: context,
      ) => void
    }
  }
>

export type UseRevokeNameReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    RevokeNameReturnType,
    Error,
    RevokeNameParameters,
    context
  > & {
    revokeName: (variables: RevokeNameParameters) => void
    revokeNameAsync: (
      variables: RevokeNameParameters,
    ) => Promise<RevokeNameReturnType>
  }
>

export function useRevokeName<context = unknown>(
  parameters: UseRevokeNameParameters<context> = {},
): UseRevokeNameReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    ...mutationRest
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['revokeName'],
    mutationFn: (variables: RevokeNameParameters) =>
      revokeName(config, variables),
    ...mutationRest,
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
    }),
  })

  type Return = UseRevokeNameReturnType<context>
  return {
    ...(mutation as unknown as Return),
    revokeName: mutation.mutate as Return['revokeName'],
    revokeNameAsync: mutation.mutateAsync as Return['revokeNameAsync'],
  }
}
