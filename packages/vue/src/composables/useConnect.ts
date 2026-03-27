import type {
  Compute,
  ConnectErrorType,
  ConnectParameters,
  ConnectReturnType,
} from '@growae/reactive'
import { connect } from '@growae/reactive'
import { useMutation } from '@tanstack/vue-query'
import { onScopeDispose } from 'vue'
import type { ConfigParameter } from '../types/properties.js'
import { adaptLegacyMutationCallbacks } from '../utils/adaptLegacyMutationCallbacks.js'
import type { UseMutationReturnType } from '../utils/query.js'
import { useConfig } from './useConfig.js'
import { useConnectors } from './useConnectors.js'

export type UseConnectParameters<context = unknown> = Compute<
  ConfigParameter & {
    mutation?: {
      onSuccess?: (
        data: ConnectReturnType,
        variables: ConnectParameters,
        context: context,
      ) => void
      onError?: (
        error: ConnectErrorType,
        variables: ConnectParameters,
        context: context,
      ) => void
      onSettled?: (
        data: ConnectReturnType | undefined,
        error: ConnectErrorType | null,
        variables: ConnectParameters,
        context: context,
      ) => void
    }
  }
>

export type UseConnectReturnType<context = unknown> = Compute<
  UseMutationReturnType<
    ConnectReturnType,
    ConnectErrorType,
    ConnectParameters,
    context
  > & {
    connect: (variables: ConnectParameters) => void
    connectAsync: (variables: ConnectParameters) => Promise<ConnectReturnType>
    connectors: ReturnType<typeof useConnectors>['value']
  }
>

export function useConnect<context = unknown>(
  parameters: UseConnectParameters<context> = {},
): UseConnectReturnType<context> {
  const config = useConfig(parameters)

  const {
    onSuccess: mutationOnSuccess,
    onError: mutationOnError,
    onSettled: mutationOnSettled,
    ...mutationRest
  } = parameters.mutation ?? {}

  const mutation = useMutation({
    mutationKey: ['connect'],
    mutationFn: (variables: ConnectParameters) => connect(config, variables),
    ...mutationRest,
    ...adaptLegacyMutationCallbacks<context>({
      onSuccess: mutationOnSuccess,
      onError: mutationOnError,
      onSettled: mutationOnSettled,
    }),
  })

  const unsubscribe = config.subscribe(
    ({ status }) => status,
    (status, previousStatus) => {
      if (previousStatus === 'connected' && status === 'disconnected')
        mutation.reset()
    },
  )
  onScopeDispose(() => unsubscribe())

  type Return = UseConnectReturnType<context>
  return {
    ...(mutation as unknown as Return),
    connect: mutation.mutate as Return['connect'],
    connectAsync: mutation.mutateAsync as Return['connectAsync'],
    connectors: useConnectors({ config }).value,
  }
}
