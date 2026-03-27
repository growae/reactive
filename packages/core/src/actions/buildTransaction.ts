import { type Tag, buildTxAsync } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../constants.js'
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
    ttl: txFields.ttl ?? DEFAULT_TTL,
    onNode: node,
  })

  return tx
}
