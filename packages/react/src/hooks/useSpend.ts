'use client'

import {
  type SpendErrorType,
  type SpendParameters,
  type SpendReturnType,
  spend,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseSpendParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: SpendReturnType,
        variables: SpendParameters,
        context: context,
      ) => void
      onError?: (
        error: SpendErrorType,
        variables: SpendParameters,
        context: context,
      ) => void
    }
  }
>

export type UseSpendReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    SpendReturnType,
    SpendErrorType,
    SpendParameters,
    context
  > & {
    spend: (variables: SpendParameters) => void
    spendAsync: (variables: SpendParameters) => Promise<SpendReturnType>
  }
>

export function useSpend<context = unknown>(
  parameters: UseSpendParameters<context> = {},
): UseSpendReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['spend'],
    mutationFn: (variables: SpendParameters) => spend(config, variables),
    ...parameters.mutation,
  } as any)

  type Return = UseSpendReturnType<context>
  return {
    ...(mutation as unknown as Return),
    spend: mutation.mutate as unknown as Return['spend'],
    spendAsync: mutation.mutateAsync as unknown as Return['spendAsync'],
  }
}
