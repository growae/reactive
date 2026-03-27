'use client'

import {
  type DefaultError,
  type MutateFunction,
  type QueryKey,
  useQuery as tanstack_useQuery,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
  useMutation,
} from '@tanstack/react-query'
import { hashFn } from '@growae/reactive/query'
import type { Compute, ExactPartial, LooseOmit, UnionStrictOmit } from '@growae/reactive'

export { useMutation }

export type UseMutationParameters<
  data = unknown,
  error = Error,
  variables = void,
  context = unknown,
> = Compute<
  LooseOmit<
    UseMutationOptions<data, error, Compute<variables>, context>,
    'mutationFn' | 'mutationKey' | 'throwOnError'
  >
>

export type UseMutationReturnType<
  data = unknown,
  error = Error,
  variables = void,
  context = unknown,
  mutate = MutateFunction,
  mutateAsync = MutateFunction,
> = Compute<
  UnionStrictOmit<
    UseMutationResult<data, error, variables, context>,
    'mutate' | 'mutateAsync'
  > & {
    mutate: mutate
    mutateAsync: mutateAsync
  }
>

export function useQuery<queryFnData, error, data, queryKey extends QueryKey>(
  parameters: UseQueryParameters<queryFnData, error, data, queryKey> & {
    queryKey: QueryKey
  },
): UseQueryReturnType<data, error> {
  const result = tanstack_useQuery({
    ...(parameters as any),
    queryKeyHashFn: hashFn,
  }) as UseQueryReturnType<data, error>
  result.queryKey = parameters.queryKey
  return result
}

export type UseQueryParameters<
  queryFnData = unknown,
  error = DefaultError,
  data = queryFnData,
  queryKey extends QueryKey = QueryKey,
> = Compute<
  ExactPartial<
    LooseOmit<UseQueryOptions<queryFnData, error, data, queryKey>, 'initialData'>
  > & {
    initialData?:
      | UseQueryOptions<queryFnData, error, data, queryKey>['initialData']
      | undefined
  }
>

export type UseQueryReturnType<data = unknown, error = DefaultError> = Compute<
  UseQueryResult<data, error> & {
    queryKey: QueryKey
  }
>
