import type { MutationOptions } from '@tanstack/query-core'
import {
  type ChannelWithdrawParameters,
  type ChannelWithdrawReturnType,
  channelWithdraw,
} from '../actions/channel/channelWithdraw.js'
import type { Config } from '../createConfig.js'

export type ChannelWithdrawErrorType = Error

export function channelWithdrawMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: ChannelWithdrawParameters) => {
      return channelWithdraw(config, variables)
    },
    mutationKey: ['channelWithdraw'],
  } satisfies MutationOptions<
    ChannelWithdrawReturnType,
    ChannelWithdrawErrorType,
    ChannelWithdrawParameters
  >
}

export type ChannelWithdrawMutationOptions = ReturnType<
  typeof channelWithdrawMutationOptions
>
export type ChannelWithdrawData = ChannelWithdrawReturnType
export type ChannelWithdrawVariables = ChannelWithdrawParameters
