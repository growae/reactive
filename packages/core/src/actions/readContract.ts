import type { Config } from '../createConfig.js'
import {
  type CallContractParameters,
  type CallContractReturnType,
  callContract,
} from './callContract.js'

export type ReadContractParameters = Omit<CallContractParameters, 'options'> & {
  options?: Omit<NonNullable<CallContractParameters['options']>, 'callStatic'>
}

export type ReadContractReturnType = CallContractReturnType

export async function readContract(
  config: Config,
  parameters: ReadContractParameters,
): Promise<ReadContractReturnType> {
  const { options, ...rest } = parameters
  return callContract(config, {
    ...rest,
    options: { ...options, callStatic: true },
  })
}
