'use client'

import {
  type QueryOracleParameters,
  type QueryOracleReturnType,
  queryOracle,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseQueryOracleParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: QueryOracleReturnType,
        variables: QueryOracleParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: QueryOracleParameters,
        context: context,
      ) => void
    }
  }
>

export type UseQueryOracleReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    QueryOracleReturnType,
    Error,
    QueryOracleParameters,
    context
  > & {
    queryOracle: (variables: QueryOracleParameters) => void
    queryOracleAsync: (
      variables: QueryOracleParameters,
    ) => Promise<QueryOracleReturnType>
  }
>

export function useQueryOracle<context = unknown>(
  parameters: UseQueryOracleParameters<context> = {},
): UseQueryOracleReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['queryOracle'],
    mutationFn: (variables: QueryOracleParameters) =>
      queryOracle(config, variables),
    ...parameters.mutation,
  } as any)

  type Return = UseQueryOracleReturnType<context>
  return {
    ...(mutation as unknown as Return),
    queryOracle: mutation.mutate as unknown as Return['queryOracle'],
    queryOracleAsync:
      mutation.mutateAsync as unknown as Return['queryOracleAsync'],
  }
}
