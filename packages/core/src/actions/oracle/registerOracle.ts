import { Tag, buildTx } from '@aeternity/aepp-sdk'
import { DEFAULT_TTL } from '../../constants'
import type { Config } from '../../createConfig'
import { BaseError } from '../../errors/base'

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
  const { queryFormat, responseFormat, queryFee, oracleTtl, ttl, networkId } =
    parameters

  const node = config.getNodeClient({ networkId })
  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new RegisterOracleNoAccountError()
  }

  const senderId = connection.accounts[0] as `ak_${string}`
  if (!senderId) throw new Error('No account available')

  const accountInfo = await node.getAccountByPubkey(senderId)

  const tx = buildTx({
    tag: Tag.OracleRegisterTx,
    accountId: senderId,
    nonce: accountInfo.nonce + 1,
    queryFormat,
    responseFormat,
    queryFee: queryFee != null ? Number(queryFee) : undefined,
    oracleTtlType: oracleTtl?.type === 'block' ? 1 : 0,
    oracleTtlValue: oracleTtl?.value ?? 500,
    ttl: ttl ?? DEFAULT_TTL,
  })

  const connector = connection.connector
  if (!connector.signTransaction) {
    throw new Error('Connector does not support transaction signing')
  }

  const signed = await connector.signTransaction({
    tx,
    networkId: networkId ?? config.state.networkId,
  })

  const result = await node.postTransaction({ tx: signed })

  const oracleId = senderId.replace(
    'ak_',
    'ok_',
  ) as `ok_${string}`

  return {
    oracleId,
    txHash: result.txHash,
    rawTx: signed,
  }
}
