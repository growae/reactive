import type { Config } from '../createConfig'
import {
  type ReadContractParameters,
  type ReadContractReturnType,
  readContract,
} from './readContract'

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
