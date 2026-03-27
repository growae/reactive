import type {
  Compute,
  OpenChannelParameters,
  OpenChannelReturnType,
} from '@growae/reactive'
import { openChannel } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties.js'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

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
    ...mutationRest
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['openChannel'],
    mutationFn: (variables: OpenChannelParameters) =>
      openChannel(config, variables),
    ...mutationRest,
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
    }),
  })

  type Return = UseOpenChannelReturnType<context>
  return {
    ...(mutation as unknown as Return),
    openChannel: mutation.mutate as Return['openChannel'],
    openChannelAsync: mutation.mutateAsync as Return['openChannelAsync'],
  }
}
