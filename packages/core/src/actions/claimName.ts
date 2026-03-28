import { Tag, buildTx, produceNameId } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type ClaimNameParameters = {
  name: string
  salt: bigint | string
  nameFee?: bigint | undefined
  networkId?: string | undefined
}

export type ClaimNameReturnType = {
  nameId: string
  txHash: string
}

export type ClaimNameErrorType = BaseErrorType | ErrorType

export async function claimName(
  config: Config,
  parameters: ClaimNameParameters,
): Promise<ClaimNameReturnType> {
  const { name, salt, nameFee, networkId } = parameters

  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new Error('No connected account')
  }

  const node = config.getNodeClient({ networkId })
  const senderId = connection.activeAccount
  if (!senderId) throw new Error('No account available')

  const accountInfo = await node.getAccountByPubkey(senderId)
  const tx = buildTx({
    tag: Tag.NameClaimTx,
    accountId: senderId,
    name,
    nameSalt: BigInt(salt),
    nameFee: nameFee != null ? BigInt(nameFee) : undefined,
    nonce: accountInfo.nonce + 1,
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

  return {
    nameId: produceNameId(name as `${string}.chain`),
    txHash: result.txHash,
  }
}
