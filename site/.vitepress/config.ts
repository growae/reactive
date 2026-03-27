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
      text: 'Actions',
      items: [
        { text: 'getBalance', link: '/core/api/actions/getBalance' },
        { text: 'spend', link: '/core/api/actions/spend' },
        {
          text: 'sendTransaction',
          link: '/core/api/actions/sendTransaction',
        },
        { text: 'connect', link: '/core/api/actions/connect' },
        { text: 'signMessage', link: '/core/api/actions/signMessage' },
        { text: 'readContract', link: '/core/api/actions/readContract' },
        { text: 'callContract', link: '/core/api/actions/callContract' },
        {
          text: 'deployContract',
          link: '/core/api/actions/deployContract',
        },
      ],
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
        {
          text: 'ReactiveProvider',
          link: '/react/api/ReactiveProvider',
        },
      ],
    },
    {
      text: 'Hooks',
      items: [
        { text: 'useConnect', link: '/react/api/hooks/useConnect' },
        {
          text: 'useDisconnect',
          link: '/react/api/hooks/useDisconnect',
        },
        { text: 'useBalance', link: '/react/api/hooks/useBalance' },
        { text: 'useHeight', link: '/react/api/hooks/useHeight' },
        {
          text: 'useSendTransaction',
          link: '/react/api/hooks/useSendTransaction',
        },
        { text: 'useSpend', link: '/react/api/hooks/useSpend' },
        {
          text: 'useReadContract',
          link: '/react/api/hooks/useReadContract',
        },
        {
          text: 'useCallContract',
          link: '/react/api/hooks/useCallContract',
        },
        {
          text: 'useDeployContract',
          link: '/react/api/hooks/useDeployContract',
        },
        {
          text: 'useSignMessage',
          link: '/react/api/hooks/useSignMessage',
        },
        {
          text: 'useSignTypedData',
          link: '/react/api/hooks/useSignTypedData',
        },
        {
          text: 'useResolveName',
          link: '/react/api/hooks/useResolveName',
        },
        {
          text: 'usePreclaimName',
          link: '/react/api/hooks/usePreclaimName',
        },
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
      items: [
        { text: 'ReactivePlugin', link: '/vue/api/ReactivePlugin' },
      ],
    },
    {
      text: 'Composables',
      items: [
        { text: 'useConnect', link: '/vue/api/composables/useConnect' },
        {
          text: 'useDisconnect',
          link: '/vue/api/composables/useDisconnect',
        },
        { text: 'useBalance', link: '/vue/api/composables/useBalance' },
        { text: 'useHeight', link: '/vue/api/composables/useHeight' },
        {
          text: 'useSendTransaction',
          link: '/vue/api/composables/useSendTransaction',
        },
        { text: 'useSpend', link: '/vue/api/composables/useSpend' },
        {
          text: 'useReadContract',
          link: '/vue/api/composables/useReadContract',
        },
        {
          text: 'useCallContract',
          link: '/vue/api/composables/useCallContract',
        },
        {
          text: 'useSignMessage',
          link: '/vue/api/composables/useSignMessage',
        },
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
        {
          text: 'ReactiveProvider',
          link: '/solid/api/ReactiveProvider',
        },
      ],
    },
    {
      text: 'Primitives',
      items: [
        {
          text: 'useConnect',
          link: '/solid/api/primitives/useConnect',
        },
        {
          text: 'useDisconnect',
          link: '/solid/api/primitives/useDisconnect',
        },
        {
          text: 'useBalance',
          link: '/solid/api/primitives/useBalance',
        },
        {
          text: 'useHeight',
          link: '/solid/api/primitives/useHeight',
        },
        {
          text: 'useSendTransaction',
          link: '/solid/api/primitives/useSendTransaction',
        },
        {
          text: 'useSpend',
          link: '/solid/api/primitives/useSpend',
        },
        {
          text: 'useReadContract',
          link: '/solid/api/primitives/useReadContract',
        },
        {
          text: 'useCallContract',
          link: '/solid/api/primitives/useCallContract',
        },
        {
          text: 'useSignMessage',
          link: '/solid/api/primitives/useSignMessage',
        },
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
      items: [
        { text: 'create-reactive', link: '/cli/create-reactive' },
      ],
    },
  ]
}
