import type { MutationOptions } from '@tanstack/query-core'
import {
  type ChannelDepositParameters,
  type ChannelDepositReturnType,
  channelDeposit,
} from '../actions/channel/channelDeposit.js'
import type { Config } from '../createConfig.js'

export type ChannelDepositErrorType = Error

export function channelDepositMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: ChannelDepositParameters) => {
      return channelDeposit(config, variables)
    },
    mutationKey: ['channelDeposit'],
  } satisfies MutationOptions<ChannelDepositReturnType, ChannelDepositErrorType, ChannelDepositParameters>
}

export type ChannelDepositMutationOptions = ReturnType<typeof channelDepositMutationOptions>
export type ChannelDepositData = ChannelDepositReturnType
export type ChannelDepositVariables = ChannelDepositParameters
