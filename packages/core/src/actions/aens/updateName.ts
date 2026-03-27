import { DEFAULT_TTL } from '../../constants.js'
import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type NamePointer = {
  key: string
  id: string
}

export type UpdateNameParameters = {
  name: string
  pointers: NamePointer[]
  extendPointers?: boolean
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
  networkId?: string
}

export type UpdateNameReturnType = {
  txHash: string
  rawTx: string
  blockHeight?: number
}

export class UpdateNameNoAccountError extends BaseError {
  override name = 'UpdateNameNoAccountError'
  constructor() {
    super('Cannot update name without a connected account.')
  }
}

export async function updateName(
  config: Config,
  parameters: UpdateNameParameters,
): Promise<UpdateNameReturnType> {
  const { name, pointers, extendPointers, ttl, networkId } = parameters

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new UpdateNameNoAccountError()
  }

  const { Name } = await import('@aeternity/aepp-sdk')
  const nameInstance = new Name(name as any, {
    onNode: node,
    onAccount: connection.accounts[0] as any,
  })

  const pointersMap = Object.fromEntries(
    pointers.map(({ key, id }) => [key, id]),
  )

  const result = await nameInstance.update(pointersMap as any, {
    extendPointers,
    ttl: ttl ?? DEFAULT_TTL,
  } as any)

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
