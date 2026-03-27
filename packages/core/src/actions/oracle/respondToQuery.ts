import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type RespondToQueryParameters = {
  oracleId: string
  queryId: string
  response: string
  responseTtl?: { type: 'delta' | 'block'; value: number }
  networkId?: string
}

export type RespondToQueryReturnType = {
  txHash: string
  rawTx: string
  blockHeight?: number
}

export class RespondToQueryNoAccountError extends BaseError {
  override name = 'RespondToQueryNoAccountError'
  constructor() {
    super('Cannot respond to oracle query without a connected account.')
  }
}

export async function respondToQuery(
  config: Config,
  parameters: RespondToQueryParameters,
): Promise<RespondToQueryReturnType> {
  const { queryId, response, responseTtl, networkId } = parameters

  const node = config.getNode({ networkId })
  const connection = config.state.current
  if (!connection) {
    throw new RespondToQueryNoAccountError()
  }

  const { Oracle } = await import('@aeternity/aepp-sdk')
  const oracle = new Oracle(connection.account, {
    onNode: node,
    ...(responseTtl ? { responseTtl } : {}),
  })

  const result = await oracle.respondToQuery(queryId as any, response)

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
