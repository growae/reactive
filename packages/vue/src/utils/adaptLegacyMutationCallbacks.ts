import type { MutationFunctionContext } from '@tanstack/vue-query'

/** Bridges legacy 3-arg onSuccess/onError and 4-arg onSettled to TanStack Vue Query v5 callbacks. */
export function adaptLegacyMutationCallbacks<context>(callbacks: {
  onSuccess?: (data: any, variables: any, ctx: context) => void
  onError?: (error: any, variables: any, ctx: context) => void
  onSettled?: (data: any, error: any, variables: any, ctx: context) => void
}) {
  const { onSuccess, onError, onSettled } = callbacks
  return {
    ...(onSuccess
      ? {
          onSuccess: (
            data: unknown,
            variables: unknown,
            onMutateResult: context,
            _mutationFnContext: MutationFunctionContext,
          ) => onSuccess(data, variables, onMutateResult),
        }
      : {}),
    ...(onError
      ? {
          onError: (
            error: unknown,
            variables: unknown,
            onMutateResult: context | undefined,
            _mutationFnContext: MutationFunctionContext,
          ) => onError(error, variables, onMutateResult as context),
        }
      : {}),
    ...(onSettled
      ? {
          onSettled: (
            data: unknown,
            err: unknown,
            variables: unknown,
            onMutateResult: context | undefined,
            _mutationFnContext: MutationFunctionContext,
          ) => onSettled(data, err, variables, onMutateResult as context),
        }
      : {}),
  }
}
