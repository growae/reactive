import type {
  Compute,
  DeployContractErrorType,
  DeployContractParameters,
  DeployContractReturnType,
} from '@growae/reactive'
import { deployContract } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties.js'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

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
      onSettled?: (
        data: DeployContractReturnType | undefined,
        error: DeployContractErrorType | null,
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

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    ...mutationRest
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['deployContract'],
    mutationFn: (variables: DeployContractParameters) =>
      deployContract(config, variables),
    ...mutationRest,
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
    }),
  })

  type Return = UseDeployContractReturnType<context>
  return {
    ...(mutation as unknown as Return),
    deployContract: mutation.mutate as Return['deployContract'],
    deployContractAsync: mutation.mutateAsync as Return['deployContractAsync'],
  }
}
