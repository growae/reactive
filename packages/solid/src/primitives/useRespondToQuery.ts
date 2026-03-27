import { createMutation } from '@tanstack/solid-query'
import {
  type RespondToQueryParameters,
  type RespondToQueryReturnType,
  respondToQuery,
} from '@reactive/core'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig.js'

export type UseRespondToQueryParameters = Accessor<{ config?: import('@reactive/core').Config | undefined }>

export function useRespondToQuery(
  parameters: UseRespondToQueryParameters = () => ({}),
) {
  const config = useConfig(parameters)
  return createMutation(() => ({
    mutationKey: ['respondToQuery'],
    mutationFn: (variables: RespondToQueryParameters) =>
      respondToQuery(config(), variables),
  }))
}
