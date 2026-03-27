import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type NamePointer = {
  key: string
  id: string
}

export type UpdateNameParameters = {
  nameId: string
  pointers: NamePointer[]
  clientTtl?: number | undefined
  nameTtl?: number | undefined
  networkId?: string | undefined
}

export type UpdateNameReturnType = {
  txHash: string
}

export type UpdateNameErrorType = BaseErrorType | ErrorType

export async function updateName(
  config: Config,
  parameters: UpdateNameParameters,
): Promise<UpdateNameReturnType> {
  const { nameId, pointers, clientTtl, nameTtl, networkId } = parameters

  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new Error('No connected account')
  }

  const node = config.getNodeClient({ networkId })
  const { buildTx, Tag } = await import('@aeternity/aepp-sdk')

  const senderId = connection.accounts[0]
  if (!senderId) throw new Error('No account available')

  const accountInfo = await node.getAccountByPubkey(senderId)
  const tx = buildTx({
    tag: Tag.NameUpdateTx,
    accountId: senderId,
    nameId,
    pointers: pointers.map((p) => ({ key: p.key, id: p.id })),
    clientTtl: clientTtl ?? 3600,
    nameTtl: nameTtl ?? 50000,
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

  return { txHash: result.txHash }
}
