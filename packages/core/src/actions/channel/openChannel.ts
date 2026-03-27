import { Channel } from '@aeternity/aepp-sdk'
import type { Config } from '../../createConfig'
import { BaseError } from '../../errors/base'

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
  _config: Config,
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

  const options: Record<string, unknown> = {
    url,
    role,
    initiatorId,
    responderId,
    initiatorAmount: Number(initiatorAmount),
    responderAmount: Number(responderAmount),
    pushAmount: Number(pushAmount),
    channelReserve: Number(channelReserve),
    sign,
  }
  if (ttl != null) options.ttl = ttl
  if (host) options.host = host
  if (port != null) options.port = port
  if (lockPeriod != null) options.lockPeriod = lockPeriod
  if (debug != null) options.debug = debug

  const channel = await Channel.initialize(
    options as unknown as Parameters<typeof Channel.initialize>[0],
  )

  return {
    channel,
    channelId: channel.id(),
  }
}
