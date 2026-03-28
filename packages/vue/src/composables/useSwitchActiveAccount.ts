import type {
  Compute,
  SwitchActiveAccountParameters,
  SwitchActiveAccountReturnType,
} from '@growae/reactive'
import { switchActiveAccount } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseSwitchActiveAccountParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: SwitchActiveAccountReturnType,
        variables: SwitchActiveAccountParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: SwitchActiveAccountParameters,
        context: context,
      ) => void
      onSettled?: (
        data: SwitchActiveAccountReturnType | undefined,
        error: Error | null,
        variables: SwitchActiveAccountParameters,
        context: context,
      ) => void
    }
  }
>

export type UseSwitchActiveAccountReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    SwitchActiveAccountReturnType,
    Error,
    SwitchActiveAccountParameters,
    context
  > & {
    switchActiveAccount: (variables: SwitchActiveAccountParameters) => void
    switchActiveAccountAsync: (
      variables: SwitchActiveAccountParameters,
    ) => Promise<SwitchActiveAccountReturnType>
  }
>

export function useSwitchActiveAccount<context = unknown>(
  parameters: UseSwitchActiveAccountParameters<context> = {},
): UseSwitchActiveAccountReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['switchActiveAccount'],
    mutationFn: async (variables: SwitchActiveAccountParameters) => {
      switchActiveAccount(config, variables)
    },
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseSwitchActiveAccountReturnType<context>
  return {
    ...(mutation as unknown as Return),
    switchActiveAccount: mutation.mutate as Return['switchActiveAccount'],
    switchActiveAccountAsync:
      mutation.mutateAsync as Return['switchActiveAccountAsync'],
  }
}
