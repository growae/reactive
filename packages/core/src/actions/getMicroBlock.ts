import type { Node } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type GetMicroBlockParameters = {
  hash: string
  networkId?: string | undefined
}

export type GetMicroBlockReturnType = {
  hash: string
  height: number
  pofHash: string
  prevHash: string
  prevKeyHash: string
  stateHash: string
  time: number
  txsHash: string
  version: number
  transactions: any[]
}

export type GetMicroBlockErrorType = BaseErrorType | ErrorType

export async function getMicroBlock(
  config: Config,
  parameters: GetMicroBlockParameters,
): Promise<GetMicroBlockReturnType> {
  const { hash } = parameters
  const node: Node = config.getNodeClient({ networkId: parameters.networkId })

  const [header, txs] = await Promise.all([
    node.getMicroBlockHeaderByHash(hash),
    node.getMicroBlockTransactionsByHash(hash),
  ])

  return {
    hash: header.hash,
    height: header.height,
    pofHash: header.pofHash,
    prevHash: header.prevHash,
    prevKeyHash: header.prevKeyHash,
    stateHash: header.stateHash,
    time:
      typeof header.time === 'number'
        ? header.time
        : new Date(header.time).getTime(),
    txsHash: header.txsHash,
    version: header.version,
    transactions: txs.transactions,
  }
}
