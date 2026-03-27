import { createMutation } from '@tanstack/solid-query'
import {
  type QueryOracleParameters,
  type QueryOracleReturnType,
  queryOracle,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseQueryOracleParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

export function useQueryOracle(
  parameters: UseQueryOracleParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['queryOracle'],
    mutationFn: (variables: QueryOracleParameters) =>
      queryOracle(config(), variables),
  }))
}
