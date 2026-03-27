import type { MutationOptions } from '@tanstack/query-core'
import {
  type OpenChannelParameters,
  type OpenChannelReturnType,
  openChannel,
} from '../actions/channel/openChannel'
import type { Config } from '../createConfig'

export type OpenChannelErrorType = Error

export function openChannelMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: OpenChannelParameters) => {
      return openChannel(config, variables)
    },
    mutationKey: ['openChannel'],
  } satisfies MutationOptions<
    OpenChannelReturnType,
    OpenChannelErrorType,
    OpenChannelParameters
  >
}

export type OpenChannelMutationOptions = ReturnType<
  typeof openChannelMutationOptions
>
export type OpenChannelData = OpenChannelReturnType
export type OpenChannelVariables = OpenChannelParameters
