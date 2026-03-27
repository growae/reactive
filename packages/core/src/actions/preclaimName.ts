import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type PreclaimNameParameters = {
  name: string
  networkId?: string | undefined
}

export type PreclaimNameReturnType = {
  commitmentId: string
  salt: bigint
  txHash: string
}

export type PreclaimNameErrorType = BaseErrorType | ErrorType

export async function preclaimName(
  config: Config,
  parameters: PreclaimNameParameters,
): Promise<PreclaimNameReturnType> {
  const { name, networkId } = parameters

  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new Error('No connected account')
  }

  const node = config.getNodeClient({ networkId })
  const { genSalt, commitmentHash, buildTx, Tag } = await import(
    '@aeternity/aepp-sdk'
  )

  const salt = genSalt()
  const commitmentId = commitmentHash(name as `${string}.chain`, salt)

  const senderId = connection.accounts[0]
  if (!senderId) throw new Error('No account available')

  const accountInfo = await node.getAccountByPubkey(senderId)
  const tx = buildTx({
    tag: Tag.NamePreclaimTx,
    accountId: senderId,
    commitmentId,
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
    commitmentId,
    salt: BigInt(salt),
    txHash: result.txHash,
  }
}
