import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'
import { loadProtocol } from '../exports/protocol.js'

type Protocol = Awaited<ReturnType<typeof loadProtocol>>
export type TransactionField = Parameters<Protocol['tx']['build']>[2][number]
export type BuildTransactionParameters = {
  tag: string
  version?: number | undefined
  fields: TransactionField[]
}
export type BuildTransactionReturnType = string
export type BuildTransactionErrorType = BaseErrorType | ErrorType

/** Build an unsigned transaction from explicit wire fields without a node lookup. */
export async function buildTransaction(
  _config: Config,
  parameters: BuildTransactionParameters,
): Promise<string> {
  const { tx } = await loadProtocol()
  const { tag, version, fields } = parameters
  if (
    tag === 'SignedTx' ||
    tag === 'ChannelOffChainTx' ||
    fields.some((field) => field.key === 'fee')
  ) {
    return tx.build(tag, version, fields)
  }
  const fee = tx.minimumFee(tag, version, fields)
  return tx.build(tag, version, [
    ...fields,
    { key: 'fee', value: { tag: 'uint', val: fee } },
  ])
}
