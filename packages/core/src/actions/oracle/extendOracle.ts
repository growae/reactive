import { Oracle } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../../constants'
import type { Config } from '../../createConfig'
import { BaseError } from '../../errors/base'

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

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new ExtendOracleNoAccountError()
  }

  const oracle = new Oracle(
    connection.accounts[0] as any,
    {
      onNode: node,
      oracleTtl,
    } as any,
  )

  const result = await oracle.extendTtl({
    oracleTtl,
    ttl: ttl ?? DEFAULT_TTL,
  } as any)

  return {
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
