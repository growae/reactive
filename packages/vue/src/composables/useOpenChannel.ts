import { useMutation } from '@tanstack/vue-query'
import type {
  OpenChannelParameters,
  OpenChannelReturnType,
  Compute,
} from '@reactive/core'
import { openChannel } from '@reactive/core'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseOpenChannelParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (data: OpenChannelReturnType, variables: OpenChannelParameters, context: context) => void
      onError?: (error: Error, variables: OpenChannelParameters, context: context) => void
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
    openChannelAsync: (variables: OpenChannelParameters) => Promise<OpenChannelReturnType>
  }
>

export function useOpenChannel<context = unknown>(
  parameters: UseOpenChannelParameters<context> = {},
): UseOpenChannelReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['openChannel'],
    mutationFn: (variables: OpenChannelParameters) =>
      openChannel(config, variables),
    ...parameters.mutation,
  })

  type Return = UseOpenChannelReturnType<context>
  return {
    ...(mutation as unknown as Return),
    openChannel: mutation.mutate as Return['openChannel'],
    openChannelAsync: mutation.mutateAsync as Return['openChannelAsync'],
  }
}
