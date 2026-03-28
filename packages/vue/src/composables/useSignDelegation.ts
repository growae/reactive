import type {
  Compute,
  SignDelegationErrorType,
  SignDelegationParameters,
  SignDelegationReturnType,
} from '@growae/reactive'
import { signDelegation } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseSignDelegationParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: SignDelegationReturnType,
        variables: SignDelegationParameters,
        context: context,
      ) => void
      onError?: (
        error: SignDelegationErrorType,
        variables: SignDelegationParameters,
        context: context,
      ) => void
      onSettled?: (
        data: SignDelegationReturnType | undefined,
        error: SignDelegationErrorType | null,
        variables: SignDelegationParameters,
        context: context,
      ) => void
    }
  }
>

export type UseSignDelegationReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    SignDelegationReturnType,
    SignDelegationErrorType,
    SignDelegationParameters,
    context
  > & {
    signDelegation: (variables: SignDelegationParameters) => void
    signDelegationAsync: (
      variables: SignDelegationParameters,
    ) => Promise<SignDelegationReturnType>
  }
>

export function useSignDelegation<context = unknown>(
  parameters: UseSignDelegationParameters<context> = {},
): UseSignDelegationReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['signDelegation'],
    mutationFn: (variables: SignDelegationParameters) =>
      signDelegation(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseSignDelegationReturnType<context>
  return {
    ...(mutation as unknown as Return),
    signDelegation: mutation.mutate as Return['signDelegation'],
    signDelegationAsync: mutation.mutateAsync as Return['signDelegationAsync'],
  }
}
