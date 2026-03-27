import { DEFAULT_TTL } from '../../constants.js'
import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'

export type ExtendOracleParameters = {
  oracleId: string
  oracleTtl: { type: 'delta' | 'block'; value: number }
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
  networkId?: string
}

export type ExtendOracleReturnType = {
  txHash: string
  rawTx: string
  blockHeight?: number
}

export class ExtendOracleNoAccountError extends BaseError {
  override name = 'ExtendOracleNoAccountError'
  constructor() {
    super('Cannot extend oracle without a connected account.')
  }
}

export async function extendOracle(
  config: Config,
  parameters: ExtendOracleParameters,
): Promise<ExtendOracleReturnType> {
  const { oracleTtl, ttl, networkId } = parameters

  const node = config.getNode({ networkId })
  const connection = config.state.current
  if (!connection) {
    throw new ExtendOracleNoAccountError()
  }

  const { Oracle } = await import('@aeternity/aepp-sdk')
  const oracle = new Oracle(connection.account, {
    onNode: node,
    oracleTtl,
  })

  const result = await oracle.extendTtl({ oracleTtl, ttl: ttl ?? DEFAULT_TTL })

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
