import {
  type CompileContractParameters,
  type Config,
  compileContract,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseCompileContractParameters = Accessor<{
  config?: Config | undefined
}>

export function useCompileContract(
  parameters: UseCompileContractParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['compileContract'],
    mutationFn: (variables: CompileContractParameters) =>
      compileContract(config(), variables),
  }))
}

export type UseCompileContractReturnType = ReturnType<typeof useCompileContract>
