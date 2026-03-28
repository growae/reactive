import { defineConfig } from 'vitepress'
import type { DefaultTheme } from 'vitepress'

export default defineConfig({
  title: 'Reactive',
  description:
    'Type-safe Aeternity blockchain interactions for React, Vue, and Solid',
  cleanUrls: true,
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
        { text: 'Networks', link: '/core/networks' },
        { text: 'Multi-Account', link: '/core/guides/multi-account' },
        { text: 'AENS Names', link: '/core/guides/aens' },
        { text: 'Sophia Contracts', link: '/core/guides/contracts' },
        { text: 'Oracles', link: '/core/guides/oracles' },
        { text: 'State Channels', link: '/core/guides/channels' },
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
        { text: 'transferFunds', link: '/core/api/actions/transferFunds' },
        { text: 'sendTransaction', link: '/core/api/actions/sendTransaction' },
        {
          text: 'buildTransaction',
          link: '/core/api/actions/buildTransaction',
        },
        {
          text: 'waitForTransactionConfirm',
          link: '/core/api/actions/waitForTransactionConfirm',
        },
      ],
    },
    {
      text: 'Contracts',
      items: [
        { text: 'readContract', link: '/core/api/actions/readContract' },
        { text: 'callContract', link: '/core/api/actions/callContract' },
        { text: 'deployContract', link: '/core/api/actions/deployContract' },
        { text: 'compileContract', link: '/core/api/actions/compileContract' },
      ],
    },
    {
      text: 'Signing',
      items: [
        { text: 'signMessage', link: '/core/api/actions/signMessage' },
        { text: 'signDelegation', link: '/core/api/actions/signDelegation' },
      ],
    },
    {
      text: 'AENS',
      items: [{ text: 'getNameEntry', link: '/core/api/actions/getNameEntry' }],
    },
  ]
}

function reactSidebar(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      items: [
        { text: 'Getting Started', link: '/react/getting-started' },
        { text: 'Installation', link: '/react/installation' },
      ],
    },
    {
      text: 'Configuration',
      items: [
        { text: 'ReactiveProvider', link: '/react/api/ReactiveProvider' },
      ],
    },
    {
      text: 'Account & Wallet',
      items: [
        { text: 'useConnect', link: '/react/api/hooks/useConnect' },
        { text: 'useDisconnect', link: '/react/api/hooks/useDisconnect' },
        { text: 'useActiveAccount', link: '/react/api/hooks/useActiveAccount' },
        {
          text: 'useSwitchActiveAccount',
          link: '/react/api/hooks/useSwitchActiveAccount',
        },
        { text: 'useBalance', link: '/react/api/hooks/useBalance' },
      ],
    },
    {
      text: 'Network & Chain',
      items: [
        { text: 'useHeight', link: '/react/api/hooks/useHeight' },
        { text: 'useMicroBlock', link: '/react/api/hooks/useMicroBlock' },
      ],
    },
    {
      text: 'Transactions',
      items: [
        { text: 'useSpend', link: '/react/api/hooks/useSpend' },
        { text: 'useTransferFunds', link: '/react/api/hooks/useTransferFunds' },
        {
          text: 'useSendTransaction',
          link: '/react/api/hooks/useSendTransaction',
        },
        {
          text: 'useBuildTransaction',
          link: '/react/api/hooks/useBuildTransaction',
        },
        {
          text: 'useWaitForTransactionConfirm',
          link: '/react/api/hooks/useWaitForTransactionConfirm',
        },
      ],
    },
    {
      text: 'Contracts',
      items: [
        { text: 'useReadContract', link: '/react/api/hooks/useReadContract' },
        { text: 'useCallContract', link: '/react/api/hooks/useCallContract' },
        {
          text: 'useDeployContract',
          link: '/react/api/hooks/useDeployContract',
        },
        {
          text: 'useCompileContract',
          link: '/react/api/hooks/useCompileContract',
        },
      ],
    },
    {
      text: 'Signing',
      items: [
        { text: 'useSignMessage', link: '/react/api/hooks/useSignMessage' },
        { text: 'useSignTypedData', link: '/react/api/hooks/useSignTypedData' },
        {
          text: 'useSignDelegation',
          link: '/react/api/hooks/useSignDelegation',
        },
      ],
    },
    {
      text: 'AENS',
      items: [
        { text: 'useResolveName', link: '/react/api/hooks/useResolveName' },
        { text: 'useNameEntry', link: '/react/api/hooks/useNameEntry' },
        { text: 'usePreclaimName', link: '/react/api/hooks/usePreclaimName' },
        { text: 'useClaimName', link: '/react/api/hooks/useClaimName' },
      ],
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
          text: 'useTransferFunds',
          link: '/vue/api/composables/useTransferFunds',
        },
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
      items: [
        {
          text: 'useReadContract',
          link: '/vue/api/composables/useReadContract',
        },
        {
          text: 'useCallContract',
          link: '/vue/api/composables/useCallContract',
        },
        {
          text: 'useCompileContract',
          link: '/vue/api/composables/useCompileContract',
        },
      ],
    },
    {
      text: 'Signing',
      items: [
        { text: 'useSignMessage', link: '/vue/api/composables/useSignMessage' },
        {
          text: 'useSignDelegation',
          link: '/vue/api/composables/useSignDelegation',
        },
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
          text: 'useTransferFunds',
          link: '/solid/api/primitives/useTransferFunds',
        },
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
      items: [
        {
          text: 'useReadContract',
          link: '/solid/api/primitives/useReadContract',
        },
        {
          text: 'useCallContract',
          link: '/solid/api/primitives/useCallContract',
        },
        {
          text: 'useCompileContract',
          link: '/solid/api/primitives/useCompileContract',
        },
      ],
    },
    {
      text: 'Signing',
      items: [
        {
          text: 'useSignMessage',
          link: '/solid/api/primitives/useSignMessage',
        },
        {
          text: 'useSignDelegation',
          link: '/solid/api/primitives/useSignDelegation',
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
