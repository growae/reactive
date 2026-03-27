import type {
  ChannelDepositParameters,
  ChannelDepositReturnType,
  Compute,
} from '@growae/reactive'
import { channelDeposit } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseChannelDepositParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: ChannelDepositReturnType,
        variables: ChannelDepositParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: ChannelDepositParameters,
        context: context,
      ) => void
    }
  }
>

export type UseChannelDepositReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    ChannelDepositReturnType,
    Error,
    ChannelDepositParameters,
    context
  > & {
    channelDeposit: (variables: ChannelDepositParameters) => void
    channelDepositAsync: (
      variables: ChannelDepositParameters,
    ) => Promise<ChannelDepositReturnType>
  }
>

export function useChannelDeposit<context = unknown>(
  parameters: UseChannelDepositParameters<context> = {},
): UseChannelDepositReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['channelDeposit'],
    mutationFn: (variables: ChannelDepositParameters) =>
      channelDeposit(config, variables),
    ...parameters.mutation,
  })

  type Return = UseChannelDepositReturnType<context>
  return {
    ...(mutation as unknown as Return),
    channelDeposit: mutation.mutate as Return['channelDeposit'],
    channelDepositAsync: mutation.mutateAsync as Return['channelDepositAsync'],
  }
}
