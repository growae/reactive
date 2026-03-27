import type {
  CloseChannelParameters,
  CloseChannelReturnType,
  Compute,
} from '@growae/reactive'
import { closeChannel } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties.js'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseCloseChannelParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: CloseChannelReturnType,
        variables: CloseChannelParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: CloseChannelParameters,
        context: context,
      ) => void
      onSettled?: (
        data: CloseChannelReturnType | undefined,
        error: Error | null,
        variables: CloseChannelParameters,
        context: context,
      ) => void
    }
  }
>

export type UseCloseChannelReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    CloseChannelReturnType,
    Error,
    CloseChannelParameters,
    context
  > & {
    closeChannel: (variables: CloseChannelParameters) => void
    closeChannelAsync: (
      variables: CloseChannelParameters,
    ) => Promise<CloseChannelReturnType>
  }
>

export function useCloseChannel<context = unknown>(
  parameters: UseCloseChannelParameters<context> = {},
): UseCloseChannelReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
    ...mutationRest
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['closeChannel'],
    mutationFn: (variables: CloseChannelParameters) =>
      closeChannel(config, variables),
    ...mutationRest,
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseCloseChannelReturnType<context>
  return {
    ...(mutation as unknown as Return),
    closeChannel: mutation.mutate as Return['closeChannel'],
    closeChannelAsync: mutation.mutateAsync as Return['closeChannelAsync'],
  }
}
