# Getting Started

## Overview

`@reactive/vue` provides Vue composables for interacting with the Aeternity blockchain. Built on top of `@reactive/core` and [TanStack Vue Query](https://tanstack.com/query/v5/docs/framework/vue), it offers reactive refs, automatic caching, and loading states.

## Quick Start

### 1. Install

```bash
pnpm add @reactive/vue @tanstack/vue-query
```

### 2. Set Up Plugin

```typescript
// main.ts
import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { ReactivePlugin } from '@reactive/vue'
import { createConfig } from '@reactive/core'
import { testnet } from '@reactive/core/networks'
import { superhero } from '@reactive/core/connectors'
import App from './App.vue'

const config = createConfig({
  networks: [testnet],
  connectors: [superhero()],
})

const app = createApp(App)
app.use(VueQueryPlugin)
app.use(ReactivePlugin, { config })
app.mount('#app')
```

### 3. Use Composables

```vue
<script setup lang="ts">
import { useConnect, useBalance } from '@reactive/vue'

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
    <p v-if="balance">Balance: {{ balance.ae }} AE</p>
  </div>
</template>
```

## Default TTL

All transaction composables (`useSpend`, `useSendTransaction`, `useCallContract`) default to a **TTL of 300 blocks** (~15 hours). Override per-call:

```typescript
const { mutate: send } = useSpend()

send({
  recipient: 'ak_...',
  amount: '1.0',
  ttl: 0, // no expiration
})
```

## Next Steps

- [Installation](/vue/installation) — detailed install guide
- [ReactivePlugin](/vue/api/ReactivePlugin) — plugin setup
- [useConnect](/vue/api/composables/useConnect) — wallet connection
- [useBalance](/vue/api/composables/useBalance) — balance queries
