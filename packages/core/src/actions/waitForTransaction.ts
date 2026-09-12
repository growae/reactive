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

  // An explicit `timeout` is the caller's own bound, so the *default* `blocks`
  // must not tighten it: `blocks` bounds the wait when the caller asked for it,
  // or when they passed no bound at all. Passing both leaves both explicit, and
  // whichever fires first wins.
  const boundByBlocks = parameters.blocks != null || timeout == null

  const startTime = Date.now()
  let bounded = false
  let maxHeight: number | undefined
  let maxHeightIsTtl = false

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

    let height: number | undefined

    if (!bounded) {
      bounded = true
      if (boundByBlocks) {
        height = (await node.getCurrentKeyBlockHeight()).height
        maxHeight = height + blocks
      }
      // A transaction's `ttl` is an absolute key block height — the sdk adds
      // the current height to the relative value it is built with — so it is
      // comparable to the chain height directly. Past it the transaction can
      // never be mined, which makes it a terminal condition rather than a
      // timeout: it caps the wait whenever it is nearer than the block bound,
      // and it is the height bound when there is no block bound.
      const ttl = (tx.tx as any)?.ttl
      if (ttl != null && ttl !== 0 && (maxHeight == null || ttl < maxHeight)) {
        maxHeight = ttl
        maxHeightIsTtl = true
      }
    }

    if (maxHeight != null) {
      height ??= (await node.getCurrentKeyBlockHeight()).height
      if (height >= maxHeight) {
        throw new Error(
          maxHeightIsTtl
            ? `Transaction ${hash} expired unmined: its ttl height ${maxHeight} has passed`
            : `Transaction ${hash} was not mined within ${blocks} blocks`,
        )
      }
    }

    await pause(interval)
  }
}
