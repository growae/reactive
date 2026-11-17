import type { DefaultTheme } from 'vitepress'
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Reactive',
  description:
    'Type-safe Aeternity blockchain interactions for React, Vue, and Solid',
  cleanUrls: true,
  vite: { build: { target: 'es2022' } },
  lastUpdated: true,

  head: [
    ['meta', { property: 'og:title', content: 'Reactive' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Type-safe Aeternity blockchain interactions',
      },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['link', { rel: 'stylesheet', href: '/styles/custom.css' }],
  ],

  themeConfig: {
    nav: [
      { text: 'React', link: '/react/getting-started' },
      { text: 'Vue', link: '/vue/getting-started' },
      { text: 'Solid', link: '/solid/getting-started' },
      { text: 'Core', link: '/core/getting-started' },
      { text: 'CLI', link: '/cli/getting-started' },
    ],

    sidebar: {
      '/react/': reactSidebar(),
      '/vue/': vueSidebar(),
      '/solid/': solidSidebar(),
      '/core/': coreSidebar(),
      '/cli/': cliSidebar(),
    },

    outline: [2, 3],

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/growae/reactive' },
    ],

    editLink: {
      pattern: 'https://github.com/growae/reactive/edit/main/site/:path',
      text: 'Suggest changes to this page',
    },

    footer: {
      message:
        'Released under the <a href="https://github.com/growae/reactive/blob/main/LICENSE">MIT License</a>.',
    },
  },
})

function coreSidebar(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      items: [
        { text: 'Getting Started', link: '/core/getting-started' },
        { text: 'Installation', link: '/core/installation' },
      ],
    },
    {
      text: 'Guides',
      items: [
        { text: 'Configuration', link: '/core/configuration' },
        { text: 'Sophia contract calls', link: '/core/sophia-contracts' },
        { text: 'Rust protocol and migration', link: '/core/rust-protocol' },
        { text: 'Networks', link: '/core/networks' },
        { text: 'Connectors', link: '/core/guides/connectors' },
        { text: 'Multi-Account', link: '/core/guides/multi-account' },

        { text: 'Error Handling', link: '/core/guides/error-handling' },
      ],
    },
    {
      text: 'Configuration',
      items: [
        { text: 'createConfig', link: '/core/api/createConfig' },
        { text: 'createStorage', link: '/core/api/createStorage' },
        { text: 'createConnector', link: '/core/api/createConnector' },
      ],
    },
    {
      text: 'Connectors',
      items: [
        { text: 'metamaskSnap', link: '/core/api/connectors/metamaskSnap' },
        { text: 'memory', link: '/core/api/connectors/memory' },
      ],
    },
    {
      text: 'Account & Wallet',
      items: [
        { text: 'connect', link: '/core/api/actions/connect' },
        {
          text: 'getActiveAccount',
          link: '/core/api/actions/getActiveAccount',
        },
        {
          text: 'switchActiveAccount',
          link: '/core/api/actions/switchActiveAccount',
        },
        {
          text: 'watchActiveAccount',
          link: '/core/api/actions/watchActiveAccount',
        },
        { text: 'getBalance', link: '/core/api/actions/getBalance' },
      ],
    },
    {
      text: 'Network & Chain',
      items: [
        { text: 'getMicroBlock', link: '/core/api/actions/getMicroBlock' },
      ],
    },
    {
      text: 'Transactions',
      items: [
        { text: 'spend', link: '/core/api/actions/spend' },

        { text: 'sendTransaction', link: '/core/api/actions/sendTransaction' },
        {
          text: 'buildTransaction',
          link: '/core/api/actions/buildTransaction',
        },
        {
          text: 'waitForTransaction',
          link: '/core/api/actions/waitForTransaction',
        },
        {
          text: 'waitForTransactionConfirm',
          link: '/core/api/actions/waitForTransactionConfirm',
        },
      ],
    },
    {
      text: 'Contracts',
      items: [],
    },
    {
      text: 'Signing',
      items: [{ text: 'signMessage', link: '/core/api/actions/signMessage' }],
    },
    {
      text: 'AENS',
      items: [{ text: 'getNameEntry', link: '/core/api/actions/getNameEntry' }],
    },
  ]
}

function reactSidebar(): DefaultTheme.SidebarItem[] {
  const hooks = [
    'useAccount',
    'useActiveAccount',
    'useBalance',
    'useBlock',
    'useBuildTransaction',
    'useBurnToken',
    'useCallContract',
    'useCallsStatus',
    'useCapabilities',
    'useConfig',
    'useConnect',
    'useConnection',
    'useConnectionEffect',
    'useConnections',
    'useConnectorClient',
    'useConnectors',
    'useContractBytecode',
    'useContractEvents',
    'useContractProof',
    'useCreateTokenAllowance',
    'useDeployContract',
    'useDisconnect',
    'useEstimateGas',
    'useFeeHistory',
    'useGasPrice',
    'useHeight',
    'useInfiniteReadContracts',
    'useMicroBlock',
    'useMicroBlockTransactionCount',
    'useMinimumFee',
    'useMintToken',
    'useNameAvatar',
    'useNameEntry',
    'useNamePointees',
    'useNameText',
    'useNetworkId',
    'useNetworks',
    'useNodeClient',
    'useReadContract',
    'useReadContracts',
    'useReconnect',
    'useResolveName',
    'useSendCalls',
    'useSendCallsSync',
    'useSendTransaction',
    'useSendTransactionSync',
    'useShowCallsStatus',
    'useSignMessage',
    'useSignTransaction',
    'useSignTypedData',
    'useSimulateContract',
    'useSpend',
    'useSwitchActiveAccount',
    'useSwitchConnection',
    'useSwitchNetwork',
    'useTokenAllowance',
    'useTokenBalance',
    'useTokenMetadata',
    'useTransaction',
    'useTransactionConfirmations',
    'useTransactionCount',
    'useTransactionReceipt',
    'useTransferToken',
    'useVerifyMessage',
    'useVerifyTypedData',
    'useWaitForCallsStatus',
    'useWaitForTransaction',
    'useWaitForTransactionConfirm',
    'useWaitForTransactionReceipt',
    'useWalletClient',
    'useWatchAsset',
    'useWatchBlocks',
    'useWatchConnection',
    'useWatchConnectors',
    'useWatchContractEvent',
    'useWatchHeight',
    'useWatchPendingTransactions',
    'useWriteContract',
    'useWriteContractSync',
  ]
  return [
    {
      text: 'Introduction',
      items: [
        { text: 'Getting Started', link: '/react/getting-started' },
        { text: 'Installation', link: '/react/installation' },
        { text: 'Wagmi hook equivalents', link: '/react/wagmi-hooks' },
        {
          text: 'Contract hook factories',
          link: '/react/contract-hook-factories',
        },
        { text: 'ReactiveProvider', link: '/react/api/ReactiveProvider' },
      ],
    },
    {
      text: 'Hook reference',
      items: hooks.map((name) => ({
        text: name,
        link: `/react/api/hooks/${name}`,
      })),
    },
  ]
}

function vueSidebar(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      items: [
        { text: 'Getting Started', link: '/vue/getting-started' },
        { text: 'Installation', link: '/vue/installation' },
      ],
    },
    {
      text: 'Configuration',
      items: [{ text: 'ReactivePlugin', link: '/vue/api/ReactivePlugin' }],
    },
    {
      text: 'Account & Wallet',
      items: [
        { text: 'useConnect', link: '/vue/api/composables/useConnect' },
        { text: 'useDisconnect', link: '/vue/api/composables/useDisconnect' },
        {
          text: 'useActiveAccount',
          link: '/vue/api/composables/useActiveAccount',
        },
        {
          text: 'useSwitchActiveAccount',
          link: '/vue/api/composables/useSwitchActiveAccount',
        },
        { text: 'useBalance', link: '/vue/api/composables/useBalance' },
      ],
    },
    {
      text: 'Network & Chain',
      items: [
        { text: 'useHeight', link: '/vue/api/composables/useHeight' },
        { text: 'useMicroBlock', link: '/vue/api/composables/useMicroBlock' },
      ],
    },
    {
      text: 'Transactions',
      items: [
        { text: 'useSpend', link: '/vue/api/composables/useSpend' },

        {
          text: 'useSendTransaction',
          link: '/vue/api/composables/useSendTransaction',
        },
        {
          text: 'useBuildTransaction',
          link: '/vue/api/composables/useBuildTransaction',
        },
        {
          text: 'useWaitForTransactionConfirm',
          link: '/vue/api/composables/useWaitForTransactionConfirm',
        },
      ],
    },
    {
      text: 'Contracts',
      items: [],
    },
    {
      text: 'Signing',
      items: [
        { text: 'useSignMessage', link: '/vue/api/composables/useSignMessage' },
      ],
    },
    {
      text: 'AENS',
      items: [
        { text: 'useNameEntry', link: '/vue/api/composables/useNameEntry' },
      ],
    },
  ]
}

function solidSidebar(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      items: [
        { text: 'Getting Started', link: '/solid/getting-started' },
        { text: 'Installation', link: '/solid/installation' },
      ],
    },
    {
      text: 'Configuration',
      items: [
        { text: 'ReactiveProvider', link: '/solid/api/ReactiveProvider' },
      ],
    },
    {
      text: 'Account & Wallet',
      items: [
        { text: 'useConnect', link: '/solid/api/primitives/useConnect' },
        { text: 'useDisconnect', link: '/solid/api/primitives/useDisconnect' },
        {
          text: 'useActiveAccount',
          link: '/solid/api/primitives/useActiveAccount',
        },
        {
          text: 'useSwitchActiveAccount',
          link: '/solid/api/primitives/useSwitchActiveAccount',
        },
        { text: 'useBalance', link: '/solid/api/primitives/useBalance' },
      ],
    },
    {
      text: 'Network & Chain',
      items: [
        { text: 'useHeight', link: '/solid/api/primitives/useHeight' },
        { text: 'useMicroBlock', link: '/solid/api/primitives/useMicroBlock' },
      ],
    },
    {
      text: 'Transactions',
      items: [
        { text: 'useSpend', link: '/solid/api/primitives/useSpend' },

        {
          text: 'useSendTransaction',
          link: '/solid/api/primitives/useSendTransaction',
        },
        {
          text: 'useBuildTransaction',
          link: '/solid/api/primitives/useBuildTransaction',
        },
        {
          text: 'useWaitForTransactionConfirm',
          link: '/solid/api/primitives/useWaitForTransactionConfirm',
        },
      ],
    },
    {
      text: 'Contracts',
      items: [],
    },
    {
      text: 'Signing',
      items: [
        {
          text: 'useSignMessage',
          link: '/solid/api/primitives/useSignMessage',
        },
      ],
    },
    {
      text: 'AENS',
      items: [
        { text: 'useNameEntry', link: '/solid/api/primitives/useNameEntry' },
      ],
    },
  ]
}

function cliSidebar(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      items: [
        { text: 'Getting Started', link: '/cli/getting-started' },
        { text: 'Installation', link: '/cli/installation' },
      ],
    },
    {
      text: 'Commands',
      items: [
        { text: 'init', link: '/cli/api/commands/init' },
        { text: 'generate', link: '/cli/api/commands/generate' },
      ],
    },
    {
      text: 'Scaffolder',
      items: [{ text: 'create-reactive', link: '/cli/create-reactive' }],
    },
  ]
}
