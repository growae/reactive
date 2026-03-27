import { createMutation } from '@tanstack/solid-query'
import {
  type ChannelDepositParameters,
  type ChannelDepositReturnType,
  channelDeposit,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseChannelDepositParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

export function useChannelDeposit(
  parameters: UseChannelDepositParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['channelDeposit'],
    mutationFn: (variables: ChannelDepositParameters) =>
      channelDeposit(config(), variables),
  }))
}
