import type { Config } from '../../createConfig'

export type ChannelTransferParameters = {
  channel: any
  from: string
  to: string
  amount: bigint | number
  sign: (tx: string, options?: any) => Promise<string>
  metadata?: string[]
}

export type ChannelTransferReturnType = {
  accepted: boolean
  signedTx?: string
}

export async function channelTransfer(
  _config: Config,
  parameters: ChannelTransferParameters,
): Promise<ChannelTransferReturnType> {
  const { channel, from, to, amount, sign, metadata } = parameters

  const result = await channel.update(from, to, Number(amount), sign, metadata)

  return {
    accepted: result.accepted,
    signedTx: result.signedTx,
  }
}
