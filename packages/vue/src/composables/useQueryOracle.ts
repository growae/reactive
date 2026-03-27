import { useMutation } from '@tanstack/vue-query'
import type {
  QueryOracleParameters,
  QueryOracleReturnType,
  Compute,
} from '@growae/reactive'
import { queryOracle } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseQueryOracleParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (data: QueryOracleReturnType, variables: QueryOracleParameters, context: context) => void
      onError?: (error: Error, variables: QueryOracleParameters, context: context) => void
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
    queryOracleAsync: (variables: QueryOracleParameters) => Promise<QueryOracleReturnType>
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
  })

  type Return = UseQueryOracleReturnType<context>
  return {
    ...(mutation as unknown as Return),
    queryOracle: mutation.mutate as Return['queryOracle'],
    queryOracleAsync: mutation.mutateAsync as Return['queryOracleAsync'],
  }
}
