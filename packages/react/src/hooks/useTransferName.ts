'use client'

import {
  type TransferNameParameters,
  type TransferNameReturnType,
  transferName,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseTransferNameParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: TransferNameReturnType,
        variables: TransferNameParameters,
        context: context,
      ) => void
      onError?: (
        error: Error,
        variables: TransferNameParameters,
        context: context,
      ) => void
    }
  }
>

export type UseTransferNameReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    TransferNameReturnType,
    Error,
    TransferNameParameters,
    context
  > & {
    transferName: (variables: TransferNameParameters) => void
    transferNameAsync: (
      variables: TransferNameParameters,
    ) => Promise<TransferNameReturnType>
  }
>

export function useTransferName<context = unknown>(
  parameters: UseTransferNameParameters<context> = {},
): UseTransferNameReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['transferName'],
    mutationFn: (variables: TransferNameParameters) =>
      transferName(config, variables),
    ...parameters.mutation,
  } as any)

  type Return = UseTransferNameReturnType<context>
  return {
    ...(mutation as unknown as Return),
    transferName: mutation.mutate as unknown as Return['transferName'],
    transferNameAsync:
      mutation.mutateAsync as unknown as Return['transferNameAsync'],
  }
}
