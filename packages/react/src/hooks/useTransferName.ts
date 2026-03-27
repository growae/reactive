'use client'

import {
  type TransferNameParameters,
  type TransferNameReturnType,
  transferName,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

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
  })

  type Return = UseTransferNameReturnType<context>
  return {
    ...(mutation as unknown as Return),
    transferName: mutation.mutate as Return['transferName'],
    transferNameAsync: mutation.mutateAsync as Return['transferNameAsync'],
  }
}
