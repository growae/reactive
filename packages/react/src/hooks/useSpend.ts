'use client'

import { useMutation } from '@tanstack/react-query'
import {
  type SpendParameters,
  type SpendReturnType,
  type SpendErrorType,
  spend,
} from '@reactive/core'
import type { Compute } from '@reactive/core'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseSpendParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (data: SpendReturnType, variables: SpendParameters, context: context) => void
      onError?: (error: SpendErrorType, variables: SpendParameters, context: context) => void
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
  })

  type Return = UseSpendReturnType<context>
  return {
    ...(mutation as unknown as Return),
    spend: mutation.mutate as Return['spend'],
    spendAsync: mutation.mutateAsync as Return['spendAsync'],
  }
}
