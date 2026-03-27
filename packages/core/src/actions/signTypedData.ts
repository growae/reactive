import { hashTypedData } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type SignTypedDataParameters = {
  domain: Record<string, unknown>
  aci: any
  data: unknown
  networkId?: string | undefined
}

export type SignTypedDataReturnType = {
  signature: string
}

export type SignTypedDataErrorType = BaseErrorType | ErrorType

export async function signTypedData(
  config: Config,
  parameters: SignTypedDataParameters,
): Promise<SignTypedDataReturnType> {
  const { domain, aci, data } = parameters

  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new Error('No connected account')
  }

  const connector = connection.connector

  const hash = hashTypedData(data as `cb_${string}`, aci, domain)
  const hashHex = Buffer.from(hash).toString('hex')

  if (!connector.signMessage) {
    throw new Error('Connector does not support message signing')
  }

  const signature = await connector.signMessage({
    message: hashHex,
    onAccount: connection.accounts[0],
  })

  return { signature }
}
