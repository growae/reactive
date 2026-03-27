import type { Node } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type GetAccountParameters = {
  address: string
  networkId?: string | undefined
  height?: number | undefined
  hash?: string | undefined
}

export type GetAccountReturnType = {
  balance: string
  nonce: number
  id: string
  kind: string
  payable: boolean
}

export type GetAccountErrorType = BaseErrorType | ErrorType

export async function getAccount(
  config: Config,
  parameters: GetAccountParameters,
): Promise<GetAccountReturnType> {
  const { address, height, hash } = parameters
  const node: Node = config.getNodeClient({ networkId: parameters.networkId })

  let account: any
  if (height != null) {
    account = await node.getAccountByPubkeyAndHeight(address, height)
  } else if (hash != null) {
    account = await node.getAccountByPubkeyAndHash(address, hash)
  } else {
    account = await node.getAccountByPubkey(address)
  }

  return {
    balance: account.balance.toString(),
    nonce: account.nonce,
    id: account.id,
    kind: account.kind,
    payable: account.payable ?? false,
  }
}
