import type { Node } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type GetBlockParameters = {
  height?: number | undefined
  hash?: string | undefined
  networkId?: string | undefined
}

export type GetBlockReturnType = {
  hash: string
  height: number
  prevHash: string
  prevKeyHash: string
  time: number
  miner?: string
  beneficiary?: string
  target?: number
  nonce?: number
}

export type GetBlockErrorType = BaseErrorType | ErrorType

export async function getBlock(
  config: Config,
  parameters: GetBlockParameters,
): Promise<GetBlockReturnType> {
  const { height, hash } = parameters
  const node: Node = config.getNodeClient({ networkId: parameters.networkId })

  let block: any
  if (hash != null) {
    block = await node.getKeyBlockByHash(hash)
  } else if (height != null) {
    block = await node.getKeyBlockByHeight(height)
  } else {
    const { height: currentHeight } = await node.getCurrentKeyBlockHeight()
    block = await node.getKeyBlockByHeight(currentHeight)
  }

  return {
    hash: block.hash,
    height: block.height,
    prevHash: block.prevHash,
    prevKeyHash: block.prevKeyHash,
    time: block.time,
    miner: block.miner,
    beneficiary: block.beneficiary,
    target: block.target,
    nonce: block.nonce,
  }
}
