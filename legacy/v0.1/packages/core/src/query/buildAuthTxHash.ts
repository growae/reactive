import type { MutationOptions } from '@tanstack/query-core'
import {
  type BuildAuthTxHashParameters,
  type BuildAuthTxHashReturnType,
  buildAuthTxHash,
} from '../actions/ga/buildAuthTxHash.js'
import type { Config } from '../createConfig.js'

export type BuildAuthTxHashErrorType = Error

export function buildAuthTxHashMutationOptions(config: Config) {
  return {
    mutationFn: async (variables: BuildAuthTxHashParameters) => {
      return buildAuthTxHash(config, variables)
    },
    mutationKey: ['buildAuthTxHash'],
  } satisfies MutationOptions<
    BuildAuthTxHashReturnType,
    BuildAuthTxHashErrorType,
    BuildAuthTxHashParameters
  >
}

export type BuildAuthTxHashMutationOptions = ReturnType<
  typeof buildAuthTxHashMutationOptions
>
export type BuildAuthTxHashData = BuildAuthTxHashReturnType
export type BuildAuthTxHashVariables = BuildAuthTxHashParameters
