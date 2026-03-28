'use client'

import {
  type CompileContractErrorType,
  type CompileContractParameters,
  type CompileContractReturnType,
  compileContract,
} from '@growae/reactive'
import type { Compute } from '@growae/reactive'
import { useMutation } from '@tanstack/react-query'
import type { ConfigParameter } from '../types/properties'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'

export type UseCompileContractParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: CompileContractReturnType,
        variables: CompileContractParameters,
        context: context,
      ) => void
      onError?: (
        error: CompileContractErrorType,
        variables: CompileContractParameters,
        context: context,
      ) => void
    }
  }
>

export type UseCompileContractReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    CompileContractReturnType,
    CompileContractErrorType,
    CompileContractParameters,
    context
  > & {
    compileContract: (variables: CompileContractParameters) => void
    compileContractAsync: (
      variables: CompileContractParameters,
    ) => Promise<CompileContractReturnType>
  }
>

export function useCompileContract<context = unknown>(
  parameters: UseCompileContractParameters<context> = {},
): UseCompileContractReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['compileContract'],
    mutationFn: (variables: CompileContractParameters) =>
      compileContract(config, variables),
    ...parameters.mutation,
  } as any)

  type Return = UseCompileContractReturnType<context>
  return {
    ...(mutation as unknown as Return),
    compileContract: mutation.mutate as unknown as Return['compileContract'],
    compileContractAsync:
      mutation.mutateAsync as unknown as Return['compileContractAsync'],
  }
}
