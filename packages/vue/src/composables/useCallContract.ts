import { useMutation } from '@tanstack/vue-query'
import type {
  CallContractParameters,
  CallContractReturnType,
  CallContractErrorType,
  Compute,
} from '@growae/reactive'
import { callContract } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseCallContractParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (data: CallContractReturnType, variables: CallContractParameters, context: context) => void
      onError?: (error: CallContractErrorType, variables: CallContractParameters, context: context) => void
    }
  }
>

export type UseCallContractReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    CallContractReturnType,
    CallContractErrorType,
    CallContractParameters,
    context
  > & {
    callContract: (variables: CallContractParameters) => void
    callContractAsync: (variables: CallContractParameters) => Promise<CallContractReturnType>
  }
>

export function useCallContract<context = unknown>(
  parameters: UseCallContractParameters<context> = {},
): UseCallContractReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['callContract'],
    mutationFn: (variables: CallContractParameters) =>
      callContract(config, variables),
    ...parameters.mutation,
  })

  type Return = UseCallContractReturnType<context>
  return {
    ...(mutation as unknown as Return),
    callContract: mutation.mutate as Return['callContract'],
    callContractAsync: mutation.mutateAsync as Return['callContractAsync'],
  }
}
