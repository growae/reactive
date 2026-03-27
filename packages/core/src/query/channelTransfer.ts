import type { MutationOptions } from '@tanstack/query-core'
import {
  type ChannelTransferParameters,
  type ChannelTransferReturnType,
  channelTransfer,
} from '../actions/channel/channelTransfer'
import type { Config } from '../createConfig'

export type ChannelTransferErrorType = Error

export function channelTransferMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: ChannelTransferParameters) => {
      return channelTransfer(config, variables)
    },
    mutationKey: ['channelTransfer'],
  } satisfies MutationOptions<
    ChannelTransferReturnType,
    ChannelTransferErrorType,
    ChannelTransferParameters
  >
}

export type ChannelTransferMutationOptions = ReturnType<
  typeof channelTransferMutationOptions
>
export type ChannelTransferData = ChannelTransferReturnType
export type ChannelTransferVariables = ChannelTransferParameters
