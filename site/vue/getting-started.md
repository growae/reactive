# Getting Started

## Overview

`@growae/reactive-vue` provides Vue composables for interacting with the Aeternity blockchain. Built on top of `@growae/reactive` and [TanStack Vue Query](https://tanstack.com/query/v5/docs/framework/vue), it offers reactive refs, automatic caching, and loading states.

## Quick Start

### 1. Install

::: code-group

```bash [npm]
npm install @growae/reactive-vue @tanstack/vue-query
```

```bash [yarn]
yarn add @growae/reactive-vue @tanstack/vue-query
```

```bash [pnpm]
pnpm add @growae/reactive-vue @tanstack/vue-query
```

:::

### 2. Set Up Plugin

```typescript
// main.ts
import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { ReactivePlugin } from '@growae/reactive-vue'
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { metamaskSnap } from '@growae/reactive/connectors'
import App from './App.vue'

const config = createConfig({
  networks: [testnet],
  connectors: [metamaskSnap()],
})

const app = createApp(App)
app.use(VueQueryPlugin)
app.use(ReactivePlugin, { config })
app.mount('#app')
```

### 3. Use Composables

```vue
<script setup lang="ts">
import { useConnect, useBalance } from '@growae/reactive-vue'

const { connect, connectors } = useConnect()
const { data: balance } = useBalance({ address: 'ak_2dA...' })
</script>

<template>
  <div>
    <button
      v-for="connector in connectors"
      :key="connector.id"
      @click="connect({ connector })"
    >
      {{ connector.name }}
    </button>
    <p v-if="balance">Balance: {{ balance }} aettos</p>
  </div>
</template>
```

## Transaction encoding

See the [Rust protocol guide](/core/rust-protocol) for signing, wire field types and the list of supported operations.

## Next Steps

- [Installation](/vue/installation) — detailed install guide
- [ReactivePlugin](/vue/api/ReactivePlugin) — plugin setup
- [Connectors](/core/guides/connectors) — all available wallet connectors (MetaMask Snap, Ledger, MetaMask Snap, and more)
- [useConnect](/vue/api/composables/useConnect) — wallet connection
- [useBalance](/vue/api/composables/useBalance) — balance queries
