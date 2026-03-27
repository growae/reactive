import type {
  Compute,
  QueryOracleParameters,
  QueryOracleReturnType,
} from '@growae/reactive'
import { queryOracle } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
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
      onSettled?: (
        data: QueryOracleReturnType | undefined,
        error: Error | null,
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

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['queryOracle'],
    mutationFn: (variables: QueryOracleParameters) =>
      queryOracle(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseQueryOracleReturnType<context>
  return {
    ...(mutation as unknown as Return),
    queryOracle: mutation.mutate as Return['queryOracle'],
    queryOracleAsync: mutation.mutateAsync as Return['queryOracleAsync'],
  }
}
