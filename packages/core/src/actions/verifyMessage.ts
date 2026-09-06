import { verifyMessageSignature } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type VerifyMessageParameters = {
  message: string
  signature: Uint8Array | string
  address: string
}

export type VerifyMessageReturnType = boolean

export type VerifyMessageErrorType = BaseErrorType | ErrorType

export function verifyMessage(
  _config: Config,
  parameters: VerifyMessageParameters,
): VerifyMessageReturnType {
  const { message, signature, address } = parameters

  const signatureBytes =
    typeof signature === 'string' ? Buffer.from(signature, 'hex') : signature

  return verifyMessageSignature(message, signatureBytes, address as any)
}
