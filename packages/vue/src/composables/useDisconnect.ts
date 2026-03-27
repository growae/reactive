import type {
  Compute,
  DisconnectErrorType,
  DisconnectParameters,
  DisconnectReturnType,
} from '@growae/reactive'
import { disconnect } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties.js'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseDisconnectParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: DisconnectReturnType,
        variables: DisconnectParameters,
        context: context,
      ) => void
      onError?: (
        error: DisconnectErrorType,
        variables: DisconnectParameters,
        context: context,
      ) => void
      onSettled?: (
        data: DisconnectReturnType | undefined,
        error: DisconnectErrorType | null,
        variables: DisconnectParameters,
        context: context,
      ) => void
    }
  }
>

export type UseDisconnectReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    DisconnectReturnType,
    DisconnectErrorType,
    DisconnectParameters,
    context
  > & {
    disconnect: (variables?: DisconnectParameters) => void
    disconnectAsync: (
      variables?: DisconnectParameters,
    ) => Promise<DisconnectReturnType>
  }
>

export function useDisconnect<context = unknown>(
  parameters: UseDisconnectParameters<context> = {},
): UseDisconnectReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    ...mutationRest
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['disconnect'],
    mutationFn: (variables: DisconnectParameters = {}) =>
      disconnect(config, variables),
    ...mutationRest,
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
    }),
  })

  type Return = UseDisconnectReturnType<context>
  return {
    ...(mutation as unknown as Return),
    disconnect: mutation.mutate as Return['disconnect'],
    disconnectAsync: mutation.mutateAsync as Return['disconnectAsync'],
  }
}
