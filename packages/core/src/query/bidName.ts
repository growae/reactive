import type { MutationOptions } from '@tanstack/query-core'
import {
  type BidNameParameters,
  type BidNameReturnType,
  bidName,
} from '../actions/aens/bidName.js'
import type { Config } from '../createConfig.js'

export type BidNameErrorType = Error

export function bidNameMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: BidNameParameters) => {
      return bidName(config, variables)
    },
    mutationKey: ['bidName'],
  } satisfies MutationOptions<BidNameReturnType, BidNameErrorType, BidNameParameters>
}

export type BidNameMutationOptions = ReturnType<typeof bidNameMutationOptions>
export type BidNameData = BidNameReturnType
export type BidNameVariables = BidNameParameters
