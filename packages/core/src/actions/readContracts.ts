import type { Config } from '../createConfig.js'
import {
  type ReadContractParameters,
  type ReadContractReturnType,
  readContract,
} from './readContract.js'

export type ReadContractsParameters = {
  contracts: ReadContractParameters[]
}

export type ReadContractsReturnType = ReadContractReturnType[]

export async function readContracts(
  config: Config,
  parameters: ReadContractsParameters,
): Promise<ReadContractsReturnType> {
  return Promise.all(
    parameters.contracts.map((contract) => readContract(config, contract)),
  )
}
