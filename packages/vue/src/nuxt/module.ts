import {
  addImports,
  addPlugin,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'

export interface ReactiveNuxtOptions {
  autoImports?: boolean
}

export default defineNuxtModule<ReactiveNuxtOptions>({
  meta: {
    name: '@growae/reactive-vue/nuxt',
    configKey: 'reactive',
    compatibility: {
      // Upper bound is the majors the Vue Nuxt Compat gate actually builds
      // against. An open `>=` re-vouches for the next major the day it
      // publishes, with nobody deciding it; the cap makes that a decision
      // with a gate behind it. The floor stays at 3.0.0 deliberately — the
      // four kit entry points used here have been stable since 3.0.0.
      nuxt: '>=3.0.0 <5.0.0',
    },
  },
  defaults: {
    autoImports: true,
  },
  setup(options: ReactiveNuxtOptions, nuxt: Nuxt) {
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
