'use client'

import {
  type DeployContractErrorType,
  type DeployContractParameters,
  type DeployContractReturnType,
  deployContract,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseDeployContractParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: DeployContractReturnType,
        variables: DeployContractParameters,
        context: context,
      ) => void
      onError?: (
        error: DeployContractErrorType,
        variables: DeployContractParameters,
        context: context,
      ) => void
    }
  }
>

export type UseDeployContractReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    DeployContractReturnType,
    DeployContractErrorType,
    DeployContractParameters,
    context
  > & {
    deployContract: (variables: DeployContractParameters) => void
    deployContractAsync: (
      variables: DeployContractParameters,
    ) => Promise<DeployContractReturnType>
  }
>

export function useDeployContract<context = unknown>(
  parameters: UseDeployContractParameters<context> = {},
): UseDeployContractReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['deployContract'],
    mutationFn: (variables: DeployContractParameters) =>
      deployContract(config, variables),
    ...parameters.mutation,
  } as any)

  type Return = UseDeployContractReturnType<context>
  return {
    ...(mutation as unknown as Return),
    deployContract: mutation.mutate as unknown as Return['deployContract'],
    deployContractAsync:
      mutation.mutateAsync as unknown as Return['deployContractAsync'],
  }
}
