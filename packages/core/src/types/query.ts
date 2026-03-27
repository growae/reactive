import type { RequiredBy, UnionLooseOmit } from './utils.js'

export type QueryParameter<
  queryFnData = unknown,
  error = Error,
  data = queryFnData,
  queryKey extends readonly unknown[] = readonly unknown[],
> = {
  query?:
    | UnionLooseOmit<
        QueryOptions<queryFnData, error, data, queryKey>,
        'queryKey' | 'queryFn'
      >
    | undefined
}

export type QueryOptions<
  queryFnData = unknown,
  error = Error,
  data = queryFnData,
  queryKey extends readonly unknown[] = readonly unknown[],
> = {
  enabled?: boolean | undefined
  gcTime?: number | undefined
  queryKey: queryKey
  queryFn: (context: {
    queryKey: queryKey
    signal: AbortSignal
  }) => Promise<queryFnData>
  refetchInterval?:
    | number
    | false
    | ((query: unknown) => number | false | undefined)
    | undefined
  refetchOnMount?: boolean | 'always' | undefined
  refetchOnReconnect?: boolean | 'always' | undefined
  refetchOnWindowFocus?: boolean | 'always' | undefined
  retry?:
    | boolean
    | number
    | ((failureCount: number, error: error) => boolean)
    | undefined
  retryDelay?:
    | number
    | ((failureCount: number, error: error) => number)
    | undefined
  select?: ((data: queryFnData) => data) | undefined
  staleTime?: number | undefined
  structuralSharing?:
    | boolean
    | ((oldData: data | undefined, newData: data) => data)
    | undefined
}

export type MutationParameter<
  data = unknown,
  error = Error,
  variables = void,
  context = unknown,
> = {
  mutation?:
    | {
        gcTime?: number | undefined
        onError?:
          | ((
              error: error,
              variables: variables,
              context: context | undefined,
            ) => unknown)
          | undefined
        onMutate?:
          | ((
              variables: variables,
            ) => Promise<context | undefined> | context | undefined)
          | undefined
        onSettled?:
          | ((
              data: data | undefined,
              error: error | null,
              variables: variables,
              context: context | undefined,
            ) => unknown)
          | undefined
        onSuccess?:
          | ((data: data, variables: variables, context: context) => unknown)
          | undefined
        retry?:
          | boolean
          | number
          | ((failureCount: number, error: error) => boolean)
          | undefined
        retryDelay?:
          | number
          | ((failureCount: number, error: error) => number)
          | undefined
      }
    | undefined
}

export type RequiredQueryOptions<
  queryFnData = unknown,
  error = Error,
  data = queryFnData,
  queryKey extends readonly unknown[] = readonly unknown[],
> = RequiredBy<QueryOptions<queryFnData, error, data, queryKey>, 'queryKey'>
