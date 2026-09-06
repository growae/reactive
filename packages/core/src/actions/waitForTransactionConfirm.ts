import type { Node } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type WaitForTransactionConfirmParameters = {
  hash: string
  networkId?: string | undefined
  confirm?: number | undefined
  interval?: number | undefined
}

export type WaitForTransactionConfirmReturnType = number

export type WaitForTransactionConfirmErrorType = BaseErrorType | ErrorType

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function waitForTransactionConfirm(
  config: Config,
  parameters: WaitForTransactionConfirmParameters,
): Promise<WaitForTransactionConfirmReturnType> {
  const { hash, confirm = 3, interval = 1000 } = parameters
  const node: Node = config.getNodeClient({ networkId: parameters.networkId })

  const { blockHeight } = await node.getTransactionByHash(hash)
  if (blockHeight === -1) {
    throw new Error(`Transaction ${hash} is not yet mined`)
  }

  const targetHeight = blockHeight + confirm

  while (true) {
    const { height } = await node.getCurrentKeyBlockHeight()
    if (height >= targetHeight) {
      const recheck = await node.getTransactionByHash(hash)
      if (recheck.blockHeight === -1) {
        throw new Error(`Transaction ${hash} was removed from the chain (fork)`)
      }
      if (recheck.blockHeight !== blockHeight) {
        return waitForTransactionConfirm(config, parameters)
      }
      return height
    }
    await pause(interval)
  }
}
