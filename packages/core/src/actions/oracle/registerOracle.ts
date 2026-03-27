import type { Config } from '../../createConfig.js'
import { BaseError } from '../../errors/base.js'
import { DEFAULT_TTL } from '../../constants.js'

export type RegisterOracleParameters = {
  queryFormat: string
  responseFormat: string
  queryFee?: bigint
  oracleTtl?: { type: 'delta' | 'block'; value: number }
  /** Transaction TTL in blocks relative to current height. Defaults to 300. */
  ttl?: number
  networkId?: string
}

export type RegisterOracleReturnType = {
  oracleId: string
  txHash: string
  rawTx: string
  blockHeight?: number
}

export class RegisterOracleNoAccountError extends BaseError {
  override name = 'RegisterOracleNoAccountError'
  constructor() {
    super('Cannot register oracle without a connected account.')
  }
}

export async function registerOracle(
  config: Config,
  parameters: RegisterOracleParameters,
): Promise<RegisterOracleReturnType> {
  const { queryFormat, responseFormat, queryFee, oracleTtl, ttl, networkId } = parameters

  const node = config.getNode({ networkId })
  const connection = config.state.current
  if (!connection) {
    throw new RegisterOracleNoAccountError()
  }

  const { Oracle } = await import('@aeternity/aepp-sdk')
  const oracle = new Oracle(connection.account, {
    onNode: node,
    ...(queryFee != null ? { queryFee: Number(queryFee) } : {}),
    ...(oracleTtl ? { oracleTtl } : {}),
  })

  const result = await oracle.register(queryFormat, responseFormat, { ttl: ttl ?? DEFAULT_TTL })

  return {
    oracleId: oracle.address,
    txHash: result.hash,
    rawTx: result.rawTx,
    blockHeight: result.blockHeight,
  }
}
