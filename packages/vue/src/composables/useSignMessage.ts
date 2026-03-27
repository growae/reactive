import type {
  Compute,
  SignMessageErrorType,
  SignMessageParameters,
  SignMessageReturnType,
} from '@growae/reactive'
import { signMessage } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseSignMessageParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: SignMessageReturnType,
        variables: SignMessageParameters,
        context: context,
      ) => void
      onError?: (
        error: SignMessageErrorType,
        variables: SignMessageParameters,
        context: context,
      ) => void
      onSettled?: (
        data: SignMessageReturnType | undefined,
        error: SignMessageErrorType | null,
        variables: SignMessageParameters,
        context: context,
      ) => void
    }
  }
>

export type UseSignMessageReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    SignMessageReturnType,
    SignMessageErrorType,
    SignMessageParameters,
    context
  > & {
    signMessage: (variables: SignMessageParameters) => void
    signMessageAsync: (
      variables: SignMessageParameters,
    ) => Promise<SignMessageReturnType>
  }
>

export function useSignMessage<context = unknown>(
  parameters: UseSignMessageParameters<context> = {},
): UseSignMessageReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['signMessage'],
    mutationFn: (variables: SignMessageParameters) =>
      signMessage(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseSignMessageReturnType<context>
  return {
    ...(mutation as unknown as Return),
    signMessage: mutation.mutate as Return['signMessage'],
    signMessageAsync: mutation.mutateAsync as Return['signMessageAsync'],
  }
}
