import type {
  Compute,
  OpenChannelParameters,
  OpenChannelReturnType,
} from '@growae/reactive'
import { openChannel } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseOpenChannelParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: OpenChannelReturnType,
        variables: OpenChannelParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: OpenChannelParameters,
        context: context,
      ) => void
      onSettled?: (
        data: OpenChannelReturnType | undefined,
        error: Error | null,
        variables: OpenChannelParameters,
        context: context,
      ) => void
    }
  }
>

export type UseOpenChannelReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    OpenChannelReturnType,
    Error,
    OpenChannelParameters,
    context
  > & {
    openChannel: (variables: OpenChannelParameters) => void
    openChannelAsync: (
      variables: OpenChannelParameters,
    ) => Promise<OpenChannelReturnType>
  }
>

export function useOpenChannel<context = unknown>(
  parameters: UseOpenChannelParameters<context> = {},
): UseOpenChannelReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['openChannel'],
    mutationFn: (variables: OpenChannelParameters) =>
      openChannel(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseOpenChannelReturnType<context>
  return {
    ...(mutation as unknown as Return),
    openChannel: mutation.mutate as Return['openChannel'],
    openChannelAsync: mutation.mutateAsync as Return['openChannelAsync'],
  }
}
