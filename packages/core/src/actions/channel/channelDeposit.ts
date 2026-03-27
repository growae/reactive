import type { Config } from '../../createConfig'

export type ChannelDepositParameters = {
  channel: any
  amount: bigint | number
  sign: (tx: string, options?: any) => Promise<string>
  onOnChainTx?: (tx: string) => void
  onOwnDepositLocked?: () => void
  onDepositLocked?: () => void
}

export type ChannelDepositReturnType = {
  accepted: boolean
  signedTx?: string
}

export async function channelDeposit(
  _config: Config,
  parameters: ChannelDepositParameters,
): Promise<ChannelDepositReturnType> {
  const {
    channel,
    amount,
    sign,
    onOnChainTx,
    onOwnDepositLocked,
    onDepositLocked,
  } = parameters

  const result = await channel.deposit(Number(amount), sign, {
    onOnChainTx,
    onOwnDepositLocked,
    onDepositLocked,
  })

  return {
    accepted: result.accepted,
    signedTx: result.state ?? result.signedTx,
  }
}
