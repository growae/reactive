import type { Node } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type WaitForTransactionParameters = {
  hash: string
  networkId?: string | undefined
  blocks?: number | undefined
  interval?: number | undefined
  timeout?: number | undefined
}

export type WaitForTransactionReturnType = {
  hash: string
  blockHash: string
  blockHeight: number
  tx: Record<string, any>
}

export type WaitForTransactionErrorType = BaseErrorType | ErrorType

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function waitForTransaction(
  config: Config,
  parameters: WaitForTransactionParameters,
): Promise<WaitForTransactionReturnType> {
  const { hash, blocks = 5, interval = 1000, timeout } = parameters
  const node: Node = config.getNodeClient({ networkId: parameters.networkId })

  const startTime = Date.now()
  let maxHeight: number | undefined

  while (true) {
    if (timeout != null && Date.now() - startTime > timeout) {
      throw new Error(
        `Waiting for transaction ${hash} timed out after ${timeout}ms`,
      )
    }

    const tx = await node.getTransactionByHash(hash)
    if (tx.blockHeight !== -1) {
      return {
        hash: tx.hash,
        blockHash: tx.blockHash,
        blockHeight: tx.blockHeight,
        tx: tx.tx as Record<string, any>,
      }
    }

    if (maxHeight == null) {
      const ttl = (tx.tx as any)?.ttl
      if (ttl != null && ttl !== 0) {
        maxHeight = -1 // wait indefinitely until TTL expires on-chain
      } else {
        const { height } = await node.getCurrentKeyBlockHeight()
        maxHeight = height + blocks
      }
    }

    if (maxHeight !== -1) {
      const { height } = await node.getCurrentKeyBlockHeight()
      if (height >= maxHeight) {
        throw new Error(
          `Transaction ${hash} was not mined within ${blocks} blocks`,
        )
      }
    }

    await pause(interval)
  }
}
