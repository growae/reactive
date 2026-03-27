import { buildTxAsync, Tag } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type BuildTransactionParameters = {
  tag: Tag
  networkId?: string | undefined
  [key: string]: any
}

export type BuildTransactionReturnType = string

export type BuildTransactionErrorType = BaseErrorType | ErrorType

export async function buildTransaction(
  config: Config,
  parameters: BuildTransactionParameters,
): Promise<BuildTransactionReturnType> {
  const { tag, networkId, ...txFields } = parameters
  const node = config.getNodeClient({ networkId })

  const tx = await buildTxAsync({
    ...txFields,
    tag,
    onNode: node,
  })

  return tx
}
