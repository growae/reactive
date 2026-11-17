import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'
import { loadProtocol } from '../exports/protocol.js'

export type VerifyMessageParameters = {
  message: string
  signature: Uint8Array | string
  address: string
}

export type VerifyMessageReturnType = boolean

export type VerifyMessageErrorType = BaseErrorType | ErrorType

export async function verifyMessage(
  _config: Config,
  parameters: VerifyMessageParameters,
): Promise<VerifyMessageReturnType> {
  const { message, signature, address } = parameters

  if (typeof signature === 'string' && !/^[0-9a-f]{128}$/i.test(signature))
    return false
  const bytes =
    typeof signature === 'string'
      ? Uint8Array.from(signature.match(/../g)!, (pair) =>
          Number.parseInt(pair, 16),
        )
      : signature
  if (bytes.length !== 64) return false
  const { keys, encoding } = await loadProtocol()
  return keys.verifyMessage(message, encoding.encode(bytes, 'sg'), address)
}
