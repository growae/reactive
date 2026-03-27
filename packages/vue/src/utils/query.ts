import {
  type DefaultError,
  type MutateFunction,
  type MutationObserverOptions,
  type QueryKey,
  type UseMutationReturnType as tanstack_UseMutationReturnType,
  type UseQueryReturnType as tanstack_UseQueryReturnType,
  useQuery as tanstack_useQuery,
  type UseQueryOptions,
  useMutation,
} from '@tanstack/vue-query'
import { hashFn } from '@reactive/core/query'
import { computed, type MaybeRef, unref } from 'vue'

import type { DeepMaybeRef, DeepUnwrapRef } from '../types/ref.js'

export { useMutation }

export type UseMutationParameters<
  data = unknown,
  error = Error,
  variables = void,
  context = unknown,
> = DeepMaybeRef<
  Omit<
    DeepUnwrapRef<
      MutationObserverOptions<data, error, variables, context>
    >,
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
> = Omit<
  tanstack_UseMutationReturnType<data, error, variables, context>,
  'mutate' | 'mutateAsync'
> & {
  mutate: mutate
  mutateAsync: mutateAsync
}

export function useQuery<queryFnData, error, data, queryKey extends QueryKey>(
  parameters: MaybeRef<
    UseQueryParameters<queryFnData, error, data, queryKey> & {
      queryKey: QueryKey
    }
  >,
): UseQueryReturnType<data, error> {
  const options = computed(() => ({
    ...(unref(parameters) as any),
    queryKeyHashFn: hashFn,
  }))
  const result = tanstack_useQuery(options) as UseQueryReturnType<data, error>
  result.queryKey = unref(options).queryKey as QueryKey
  return result
}

export type UseQueryParameters<
  queryFnData = unknown,
  error = DefaultError,
  data = queryFnData,
  queryKey extends QueryKey = QueryKey,
> = DeepMaybeRef<
  Partial<
    Omit<
      DeepUnwrapRef<
        UseQueryOptions<queryFnData, error, data, queryFnData, queryKey>
      >,
      'initialData'
    >
  > & {
    initialData?:
      | DeepUnwrapRef<
          UseQueryOptions<queryFnData, error, data, queryFnData, queryKey>
        >['initialData']
      | undefined
  }
>

export type UseQueryReturnType<data = unknown, error = DefaultError> =
  tanstack_UseQueryReturnType<data, error> & {
    queryKey: QueryKey
  }
