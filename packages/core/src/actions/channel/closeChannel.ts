import type { Config } from '../../createConfig'
import { BaseError } from '../../errors/base'

export type CloseChannelParameters = {
  channel: any
  sign: (tx: string) => Promise<string>
}

export type CloseChannelReturnType = {
  signedTx: string
}

export class CloseChannelError extends BaseError {
  override name = 'CloseChannelError'
  constructor({ message }: { message: string }) {
    super(`Failed to close channel: ${message}`)
  }
}

export async function closeChannel(
  _config: Config,
  parameters: CloseChannelParameters,
): Promise<CloseChannelReturnType> {
  const { channel, sign } = parameters

  try {
    const signedTx = await channel.shutdown(sign)
    return { signedTx }
  } catch (error) {
    throw new CloseChannelError({
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
