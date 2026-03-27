# ReactivePlugin

Vue plugin that provides the Reactive `Config` to all composables via `provide`/`inject`.

## Import

```typescript
import { ReactivePlugin } from '@growae/reactive-vue'
```

## Usage

```typescript
import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { ReactivePlugin } from '@growae/reactive-vue'
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive/networks'
import { superhero } from '@growae/reactive/connectors'
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

## Options

### config

- **Type:** `Config`
- **Required**

The Reactive config created by `createConfig`.

### reconnectOnMount

- **Type:** `boolean`
- **Default:** `true`

Automatically reconnect to previously connected wallets on mount.

## useConfig

Access the config from any component:

```typescript
import { useConfig } from '@growae/reactive-vue'

const config = useConfig()
```
