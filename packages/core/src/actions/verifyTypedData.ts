import { hashTypedData, verifySignature } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

export type VerifyTypedDataParameters = {
  data: string
  aci: any
  signature: Uint8Array | string
  address: string
  domain?:
    | {
        name?: string
        version?: number
        networkId?: string
        contractAddress?: string
      }
    | undefined
}

export type VerifyTypedDataReturnType = boolean

export type VerifyTypedDataErrorType = BaseErrorType | ErrorType

export function verifyTypedData(
  _config: Config,
  parameters: VerifyTypedDataParameters,
): VerifyTypedDataReturnType {
  const { data, aci, signature, address, domain = {} } = parameters

  const signatureBytes =
    typeof signature === 'string' ? Buffer.from(signature, 'hex') : signature

  const dataHash = hashTypedData(data as any, aci, domain as any)

  return verifySignature(dataHash, signatureBytes, address as any)
}
