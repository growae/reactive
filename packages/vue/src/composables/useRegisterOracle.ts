import { useMutation } from '@tanstack/vue-query'
import type {
  RegisterOracleParameters,
  RegisterOracleReturnType,
  Compute,
} from '@growae/reactive'
import { registerOracle } from '@growae/reactive'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'

export type UseRegisterOracleParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (data: RegisterOracleReturnType, variables: RegisterOracleParameters, context: context) => void
      onError?: (error: Error, variables: RegisterOracleParameters, context: context) => void
    }
  }
>

export type UseRegisterOracleReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    RegisterOracleReturnType,
    Error,
    RegisterOracleParameters,
    context
  > & {
    registerOracle: (variables: RegisterOracleParameters) => void
    registerOracleAsync: (variables: RegisterOracleParameters) => Promise<RegisterOracleReturnType>
  }
>

export function useRegisterOracle<context = unknown>(
  parameters: UseRegisterOracleParameters<context> = {},
): UseRegisterOracleReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['registerOracle'],
    mutationFn: (variables: RegisterOracleParameters) =>
      registerOracle(config, variables),
    ...parameters.mutation,
  })

  type Return = UseRegisterOracleReturnType<context>
  return {
    ...(mutation as unknown as Return),
    registerOracle: mutation.mutate as Return['registerOracle'],
    registerOracleAsync: mutation.mutateAsync as Return['registerOracleAsync'],
  }
}
