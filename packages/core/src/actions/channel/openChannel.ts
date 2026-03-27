import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type OpenChannelParameters = {
  url: string
  role: 'initiator' | 'responder'
  initiatorId: string
  responderId: string
  initiatorAmount: bigint | number
  responderAmount: bigint | number
  pushAmount?: bigint | number
  channelReserve?: bigint | number
  ttl?: number
  host?: string
  port?: number
  lockPeriod?: number
  sign: (tag: string, tx: string, options?: any) => Promise<string>
  debug?: boolean
  networkId?: string
}

export type OpenChannelReturnType = {
  channel: any
  channelId: string
}

export class OpenChannelNoAccountError extends BaseError {
  override name = 'OpenChannelNoAccountError'
  constructor() {
    super('Cannot open channel without a connected account.')
  }
}

export async function openChannel(
  config: Config,
  parameters: OpenChannelParameters,
): Promise<OpenChannelReturnType> {
  const {
    url,
    role,
    initiatorId,
    responderId,
    initiatorAmount,
    responderAmount,
    pushAmount = 0,
    channelReserve = 0,
    ttl,
    host,
    port,
    lockPeriod,
    sign,
    debug,
    networkId: _networkId,
  } = parameters

  const { Channel } = await import('@aeternity/aepp-sdk')
  const channel = await Channel.initialize({
    url,
    role,
    initiatorId: initiatorId as any,
    responderId: responderId as any,
    initiatorAmount: Number(initiatorAmount),
    responderAmount: Number(responderAmount),
    pushAmount: Number(pushAmount),
    channelReserve: Number(channelReserve),
    ...(ttl != null ? { ttl } : {}),
    ...(host ? { host } : {}),
    ...(port != null ? { port } : {}),
    ...(lockPeriod != null ? { lockPeriod } : {}),
    sign,
    ...(debug != null ? { debug } : {}),
  })

  return {
    channel,
    channelId: channel.id(),
  }
}
