'use client'

import {
  type TransferFundsErrorType,
  type TransferFundsParameters,
  type TransferFundsReturnType,
  transferFunds,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseTransferFundsParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: TransferFundsReturnType,
        variables: TransferFundsParameters,
        context: context,
      ) => void
      onError?: (
        error: TransferFundsErrorType,
        variables: TransferFundsParameters,
        context: context,
      ) => void
    }
  }
>

export type UseTransferFundsReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    TransferFundsReturnType,
    TransferFundsErrorType,
    TransferFundsParameters,
    context
  > & {
    transferFunds: (variables: TransferFundsParameters) => void
    transferFundsAsync: (
      variables: TransferFundsParameters,
    ) => Promise<TransferFundsReturnType>
  }
>

export function useTransferFunds<context = unknown>(
  parameters: UseTransferFundsParameters<context> = {},
): UseTransferFundsReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['transferFunds'],
    mutationFn: (variables: TransferFundsParameters) =>
      transferFunds(config, variables),
    ...parameters.mutation,
  } as any)

  type Return = UseTransferFundsReturnType<context>
  return {
    ...(mutation as unknown as Return),
    transferFunds: mutation.mutate as unknown as Return['transferFunds'],
    transferFundsAsync:
      mutation.mutateAsync as unknown as Return['transferFundsAsync'],
  }
}
