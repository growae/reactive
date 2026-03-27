import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

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
  const { domain, aci, data, networkId } = parameters

  const connection = config.state.connections.get(config.state.current!)
  if (!connection) {
    throw new Error('No connected account')
  }

  const connector = connection.connector
  const { hashTypedData } = await import('@aeternity/aepp-sdk')

  const hash = hashTypedData(data, aci, domain)
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
