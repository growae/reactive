import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type GetContractBytecodeParameters = {
  address: string
  networkId?: string | undefined
}

export type GetContractBytecodeReturnType = {
  bytecode: string
}

export type GetContractBytecodeErrorType = BaseErrorType | ErrorType

export async function getContractBytecode(
  config: Config,
  parameters: GetContractBytecodeParameters,
): Promise<GetContractBytecodeReturnType> {
  const { address } = parameters
  const node = config.getNodeClient({ networkId: parameters.networkId })

  const contract = await node.getContractByPubkey(address)

  return {
    bytecode: contract.bytecode ?? '',
  }
}
