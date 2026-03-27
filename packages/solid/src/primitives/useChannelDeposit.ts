import { type ChannelDepositParameters, channelDeposit } from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseChannelDepositParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

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
