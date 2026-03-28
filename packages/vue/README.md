<h1 align="center">@growae/reactive-vue</h1>

<p align="center">
  Vue composables for building Aeternity dApps
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@growae/reactive-vue"><img src="https://img.shields.io/npm/v/@growae/reactive-vue?colorA=21262d&colorB=3b82f6&style=flat" alt="Version"></a>
  <a href="https://www.npmjs.com/package/@growae/reactive-vue"><img src="https://img.shields.io/npm/dm/@growae/reactive-vue?colorA=21262d&colorB=3b82f6&style=flat" alt="Downloads"></a>
  <a href="https://github.com/growae/reactive/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@growae/reactive-vue?colorA=21262d&colorB=3b82f6&style=flat" alt="MIT License"></a>
</p>

<br>

## Overview

Vue adapter for `@growae/reactive`. Built on TanStack Vue Query, it provides a `ReactivePlugin` for Vue, composables like `useConnect`, `useBalance`, `useSpend`, and a Nuxt module at `@growae/reactive-vue/nuxt`.

## Install

```bash
# npm
npm install @growae/reactive-vue @growae/reactive @tanstack/vue-query

# yarn
yarn add @growae/reactive-vue @growae/reactive @tanstack/vue-query

# pnpm
pnpm add @growae/reactive-vue @growae/reactive @tanstack/vue-query
```

## Usage

```ts
import { createApp } from 'vue'
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { ReactivePlugin } from '@growae/reactive-vue'
import { VueQueryPlugin } from '@tanstack/vue-query'

const config = createConfig({ networks: [testnet] })

const app = createApp(App)
app.use(VueQueryPlugin)
app.use(ReactivePlugin, { config })
app.mount('#app')
```

```ts
import { useConnect, useBalance, useSpend } from '@growae/reactive-vue'

const { connect, connectors } = useConnect()
const { data: balance } = useBalance({ address: 'ak_...' })
const { mutate: send } = useSpend()
```

### Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@growae/reactive-vue/nuxt'],
})
```

## Peer Dependencies

- `vue >=3`
- `@tanstack/vue-query >=5`
- Optional: `nuxt >=3`

## Documentation

Visit [reactive.growae.io/vue/getting-started](https://reactive.growae.io/vue/getting-started) for the full documentation.

## License

[MIT](https://github.com/growae/reactive/blob/main/LICENSE)
