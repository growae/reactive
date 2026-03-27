import { createMutation } from '@tanstack/solid-query'
import {
  type ChannelDepositParameters,
  type ChannelDepositReturnType,
  channelDeposit,
} from '@growae/reactive'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseChannelDepositParameters = Accessor<{ config?: import('@growae/reactive').Config | undefined }>

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

export type UseChannelDepositReturnType = ReturnType<typeof useChannelDeposit>
