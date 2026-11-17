import type { Config } from '../../createConfig.js'

export type ChannelWithdrawParameters = {
  channel: any
  amount: bigint | number
  sign: (tx: string, options?: any) => Promise<string>
  onOnChainTx?: (tx: string) => void
  onOwnWithdrawLocked?: () => void
  onWithdrawLocked?: () => void
}

export type ChannelWithdrawReturnType = {
  accepted: boolean
  signedTx?: string
}

export async function channelWithdraw(
  _config: Config,
  parameters: ChannelWithdrawParameters,
): Promise<ChannelWithdrawReturnType> {
  const {
    channel,
    amount,
    sign,
    onOnChainTx,
    onOwnWithdrawLocked,
    onWithdrawLocked,
  } = parameters

  const result = await channel.withdraw(Number(amount), sign, {
    onOnChainTx,
    onOwnWithdrawLocked,
    onWithdrawLocked,
  })

  return {
    accepted: result.accepted,
    signedTx: result.signedTx,
  }
}
