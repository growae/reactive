import type { Node } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type GetBalanceParameters = {
  address: string
  networkId?: string | undefined
  format?: 'ae' | 'aettos' | undefined
}

export type GetBalanceReturnType = string

export type GetBalanceErrorType = BaseErrorType | ErrorType

const AETTOS_PER_AE = BigInt('1000000000000000000')

export async function getBalance(
  config: Config,
  parameters: GetBalanceParameters,
): Promise<GetBalanceReturnType> {
  const { address, format = 'aettos' } = parameters
  const node: Node = config.getNodeClient({ networkId: parameters.networkId })

  let balance: bigint
  try {
    const account = await node.getAccountByPubkey(address)
    balance = BigInt(account.balance)
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.response?.status === 404) {
      balance = 0n
    } else {
      throw error
    }
  }

  if (format === 'ae') {
    const whole = balance / AETTOS_PER_AE
    const remainder = balance % AETTOS_PER_AE
    if (remainder === 0n) return whole.toString()
    const remainderStr = remainder.toString().padStart(18, '0').replace(/0+$/, '')
    return `${whole}.${remainderStr}`
  }

  return balance.toString()
}
