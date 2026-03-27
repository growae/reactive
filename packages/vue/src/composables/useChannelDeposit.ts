import type {
  ChannelDepositParameters,
  ChannelDepositReturnType,
  Compute,
} from '@growae/reactive'
import { channelDeposit } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

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
      onSettled?: (
        data: ChannelDepositReturnType | undefined,
        error: Error | null,
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

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['channelDeposit'],
    mutationFn: (variables: ChannelDepositParameters) =>
      channelDeposit(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseChannelDepositReturnType<context>
  return {
    ...(mutation as unknown as Return),
    channelDeposit: mutation.mutate as Return['channelDeposit'],
    channelDepositAsync: mutation.mutateAsync as Return['channelDepositAsync'],
  }
}
