'use client'

import { useMutation } from '@tanstack/react-query'
import {
  type DeployContractParameters,
  type DeployContractReturnType,
  type DeployContractErrorType,
  deployContract,
} from '@reactive/core'
import type { Compute } from '@reactive/core'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseDeployContractParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (data: DeployContractReturnType, variables: DeployContractParameters, context: context) => void
      onError?: (error: DeployContractErrorType, variables: DeployContractParameters, context: context) => void
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
    deployContractAsync: (variables: DeployContractParameters) => Promise<DeployContractReturnType>
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
  })

  type Return = UseDeployContractReturnType<context>
  return {
    ...(mutation as unknown as Return),
    deployContract: mutation.mutate as Return['deployContract'],
    deployContractAsync: mutation.mutateAsync as Return['deployContractAsync'],
  }
}
