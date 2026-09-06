import type { MutationOptions } from '@tanstack/query-core'
import {
  type CloseChannelParameters,
  type CloseChannelReturnType,
  closeChannel,
} from '../actions/channel/closeChannel.js'
import type { Config } from '../createConfig.js'

export type CloseChannelErrorType = Error

export function closeChannelMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: CloseChannelParameters) => {
      return closeChannel(config, variables)
    },
    mutationKey: ['closeChannel'],
  } satisfies MutationOptions<
    CloseChannelReturnType,
    CloseChannelErrorType,
    CloseChannelParameters
  >
}

export type CloseChannelMutationOptions = ReturnType<
  typeof closeChannelMutationOptions
>
export type CloseChannelData = CloseChannelReturnType
export type CloseChannelVariables = CloseChannelParameters
