import type {
  Compute,
  SwitchNetworkErrorType,
  SwitchNetworkParameters,
  SwitchNetworkReturnType,
} from '@growae/reactive'
import { switchNetwork } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import type { ConfigParameter } from '../types/properties'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks'
import type { UseMutationReturnType } from '../utils/query'
import { useConfig } from './useConfig'
import { useNetworks } from './useNetworks'

export type UseSwitchNetworkParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: SwitchNetworkReturnType,
        variables: SwitchNetworkParameters,
        context: context,
      ) => void
      onError?: (
        error: SwitchNetworkErrorType,
        variables: SwitchNetworkParameters,
        context: context,
      ) => void
      onSettled?: (
        data: SwitchNetworkReturnType | undefined,
        error: SwitchNetworkErrorType | null,
        variables: SwitchNetworkParameters,
        context: context,
      ) => void
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
    switchNetworkAsync: (
      variables: SwitchNetworkParameters,
    ) => Promise<SwitchNetworkReturnType>
    networks: ReturnType<typeof useNetworks>
  }
>

export function useSwitchNetwork<context = unknown>(
  parameters: UseSwitchNetworkParameters<context> = {},
): UseSwitchNetworkReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['switchNetwork'],
    mutationFn: (variables: SwitchNetworkParameters) =>
      switchNetwork(config, variables),
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  type Return = UseSwitchNetworkReturnType<context>
  return {
    ...(mutation as unknown as Return),
    switchNetwork: mutation.mutate as Return['switchNetwork'],
    switchNetworkAsync: mutation.mutateAsync as Return['switchNetworkAsync'],
    networks: useNetworks({ config }),
  }
}
