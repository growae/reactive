import type { Config } from '../createConfig'
import type { BaseErrorType, ErrorType } from '../errors/base'

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

  const contract = await node.getContractCode(address as `ct_${string}`)

  return {
    bytecode: (contract.bytecode as string) ?? '',
  }
}
