import {
  type GetContractBytecodeErrorType,
  type GetContractBytecodeParameters,
  type GetContractBytecodeReturnType,
  getContractBytecode,
} from '../actions/getContractBytecode.js'
import type { Config } from '../createConfig.js'
import type { ExactPartial } from '../types/utils.js'

export type GetContractBytecodeOptions =
  ExactPartial<GetContractBytecodeParameters>

export function getContractBytecodeQueryKey(
  params: GetContractBytecodeOptions = {},
) {
  return ['getContractBytecode', params] as const
}

export type GetContractBytecodeQueryKey = ReturnType<
  typeof getContractBytecodeQueryKey
>

export function getContractBytecodeQueryOptions(
  config: Config,
  params: GetContractBytecodeOptions = {},
) {
  return {
    enabled: Boolean(params.address),
    queryFn: async () => {
      if (!params.address) throw new Error('address is required')
      return getContractBytecode(
        config,
        params as GetContractBytecodeParameters,
      )
    },
    queryKey: getContractBytecodeQueryKey(params),
  }
}

export type GetContractBytecodeQueryFnData = GetContractBytecodeReturnType
export type GetContractBytecodeData = GetContractBytecodeQueryFnData
export { type GetContractBytecodeErrorType }
