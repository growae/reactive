import {
  type SimulateContractParameters,
  type SimulateContractReturnType,
  simulateContract,
} from '../actions/simulateContract.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type SimulateContractOptions = ExactPartial<SimulateContractParameters>

export function simulateContractQueryKey(params: SimulateContractOptions = {}) {
  return ['simulateContract', params] as const
}

export type SimulateContractQueryKey = ReturnType<
  typeof simulateContractQueryKey
>

export function simulateContractQueryOptions(
  config: Config,
  params: SimulateContractOptions = {},
) {
  return {
    enabled: Boolean(params.address && params.aci && params.method),
    queryFn: async () => {
      if (!params.address) throw new Error('address is required')
      if (!params.aci) throw new Error('aci is required')
      if (!params.method) throw new Error('method is required')
      return simulateContract(config, params as SimulateContractParameters)
    },
    queryKey: simulateContractQueryKey(params),
  }
}

export type SimulateContractQueryFnData = SimulateContractReturnType
export type SimulateContractData = SimulateContractQueryFnData
