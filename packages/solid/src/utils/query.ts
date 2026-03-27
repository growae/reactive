import {
  type DefaultError,
  type MutateFunction,
  type QueryKey,
  type SolidMutationOptions,
  type CreateMutationResult as UseMutationResult,
  type CreateQueryResult as UseQueryResult,
  createMutation as useMutation,
  createQuery as tanstack_useQuery,
} from '@tanstack/solid-query'
import { hashFn } from '@reactive/core/query'
import type { Compute, ExactPartial, LooseOmit, UnionStrictOmit } from '@reactive/core'
import { type Accessor, mergeProps } from 'solid-js'

export type SolidMutationParameters<
  data = unknown,
  error = Error,
  variables = void,
  context = unknown,
> = Compute<
  LooseOmit<
    SolidMutationOptions<data, error, Compute<variables>, context>,
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

export { useMutation }

////////////////////////////////////////////////////////////////////////////////

export type SolidQueryParameters<
  queryFnData = unknown,
  error = DefaultError,
  data = queryFnData,
  queryKey extends QueryKey = QueryKey,
> = Compute<
  ExactPartial<
    LooseOmit<
      Parameters<typeof tanstack_useQuery<queryFnData, error, data, queryKey>>[0] extends Accessor<infer T> ? T : never,
      'initialData'
    >
  > & {
    initialData?: unknown | undefined
  }
>

export type UseQueryReturnType<data = unknown, error = DefaultError> = Compute<
  UseQueryResult<data, error> & {
    queryKey: QueryKey
  }
>

export function useQuery<queryFnData, error, data, queryKey extends QueryKey>(
  parameters: Accessor<
    SolidQueryParameters<queryFnData, error, data, queryKey> & {
      queryKey: QueryKey
    }
  >,
): UseQueryReturnType<data, error> {
  const result = tanstack_useQuery(() => ({
    ...(parameters() as any),
    queryKeyHashFn: hashFn,
  }))
  return mergeProps(result, {
    get queryKey() {
      return parameters().queryKey
    },
  }) as UseQueryReturnType<data, error>
}
