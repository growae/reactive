import { useMutation } from '@tanstack/vue-query'
import type {
  SwitchNetworkParameters,
  SwitchNetworkReturnType,
  SwitchNetworkErrorType,
  Compute,
} from '@reactive/core'
import { switchNetwork } from '@reactive/core'
import type { ConfigParameter } from '../types/properties.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useNetworks } from './useNetworks.js'

export type UseSwitchNetworkParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (data: SwitchNetworkReturnType, variables: SwitchNetworkParameters, context: context) => void
      onError?: (error: SwitchNetworkErrorType, variables: SwitchNetworkParameters, context: context) => void
    }
  }
>

export type UseSwitchNetworkReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    SwitchNetworkReturnType,
    SwitchNetworkErrorType,
    SwitchNetworkParameters,
    context
  > & {
    switchNetwork: (variables: SwitchNetworkParameters) => void
    switchNetworkAsync: (variables: SwitchNetworkParameters) => Promise<SwitchNetworkReturnType>
    networks: ReturnType<typeof useNetworks>
  }
>

export function useSwitchNetwork<context = unknown>(
  parameters: UseSwitchNetworkParameters<context> = {},
): UseSwitchNetworkReturnType<context> {
  const config = useConfig(parameters)

  const mutation = useMutation({
    mutationKey: ['switchNetwork'],
    mutationFn: (variables: SwitchNetworkParameters) =>
      switchNetwork(config, variables),
    ...parameters.mutation,
  })

  type Return = UseSwitchNetworkReturnType<context>
  return {
    ...(mutation as unknown as Return),
    switchNetwork: mutation.mutate as Return['switchNetwork'],
    switchNetworkAsync: mutation.mutateAsync as Return['switchNetworkAsync'],
    networks: useNetworks({ config }),
  }
}
