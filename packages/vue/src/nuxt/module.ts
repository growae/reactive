import { defineNuxtModule, addPlugin, addImports, createResolver } from '@nuxt/kit'

export interface ReactiveNuxtOptions {
  autoImports?: boolean
}

export default defineNuxtModule<ReactiveNuxtOptions>({
  meta: {
    name: '@growae/reactive-vue/nuxt',
    configKey: 'reactive',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    autoImports: true,
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.build.transpile.push('@growae/reactive-vue')

    addPlugin(resolve('./runtime/plugin'))

    if (options.autoImports) {
      const composables = [
        'useConfig',
        'useConnect',
        'useDisconnect',
        'useReconnect',
        'useConnection',
        'useConnections',
        'useConnectors',
        'useNetworkId',
        'useNetworks',
        'useSwitchNetwork',
        'useNodeClient',
        'useConnectorClient',
        'useBalance',
        'useHeight',
        'useAccount',
        'useBlock',
        'useTransaction',
        'useTransactionCount',
        'useWaitForTransaction',
        'useContractBytecode',
        'useEstimateGas',
        'useSendTransaction',
        'useSpend',
        'usePayForTransaction',
        'useSignMessage',
        'useSignTypedData',
        'useSignTransaction',
        'useVerifyMessage',
        'useVerifyTypedData',
        'useDeployContract',
        'useCallContract',
        'useReadContract',
        'useReadContracts',
        'useSimulateContract',
        'useContractEvents',
        'usePreclaimName',
        'useClaimName',
        'useUpdateName',
        'useTransferName',
        'useRevokeName',
        'useResolveName',
        'useRegisterOracle',
        'useQueryOracle',
        'useRespondToQuery',
        'useOracleState',
        'useOracleQueries',
        'useOpenChannel',
        'useCloseChannel',
        'useChannelDeposit',
        'useWatchHeight',
        'useWatchConnection',
        'useWatchConnectors',
      ]

      addImports(
        composables.map((name) => ({
          name,
          from: '@growae/reactive-vue',
        })),
      )
    }
  },
})
