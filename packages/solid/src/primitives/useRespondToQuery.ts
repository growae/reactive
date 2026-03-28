import {
  type Config,
  type RespondToQueryParameters,
  respondToQuery,
} from '@growae/reactive'
import { createMutation } from '@tanstack/solid-query'
import type { Accessor } from 'solid-js'
import { useConfig } from './useConfig'

export type UseRespondToQueryParameters = Accessor<{
  config?: Config | undefined
}>

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

export type UseRespondToQueryReturnType = ReturnType<typeof useRespondToQuery>
