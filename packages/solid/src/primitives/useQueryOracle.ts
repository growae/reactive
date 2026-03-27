import {
  type QueryOracleParameters,
  queryOracle,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseQueryOracleParameters = Accessor<{
  config?: import('@growae/reactive').Config | undefined
}>

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

export type UseQueryOracleReturnType = ReturnType<typeof useQueryOracle>
