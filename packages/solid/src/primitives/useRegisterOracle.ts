import {
  type RegisterOracleParameters,
  registerOracle,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseRegisterOracleParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

export function useRegisterOracle(
  parameters: UseRegisterOracleParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['registerOracle'],
    mutationFn: (variables: RegisterOracleParameters) =>
      registerOracle(config(), variables),
  }))
}

export type UseRegisterOracleReturnType = ReturnType<typeof useRegisterOracle>
