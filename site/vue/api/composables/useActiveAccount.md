# useActiveAccount

Composable for reading the currently active wallet account. Returns a reactive `Ref` updated whenever the active account changes.

## Import

```typescript
import { useActiveAccount } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup>
import { useActiveAccount } from '@growae/reactive-vue'

const activeAccount = useActiveAccount()
</script>

<template>
  <div v-if="activeAccount.isConnected">
    <p>Active: {{ activeAccount.address }}</p>
    <p>All accounts: {{ activeAccount.addresses.length }}</p>
  </div>
  <p v-else>Not connected</p>
</template>
```

## Return Type

```typescript
type UseActiveAccountReturnType = Ref<
  | {
      address: string
      addresses: readonly [string, ...string[]]
      connector: Connector
      isConnected: true
    }
  | {
      address: undefined
      addresses: undefined
      connector: undefined
      isConnected: false
    }
>
```

Access values via `.value`:

```typescript
const activeAccount = useActiveAccount()
console.log(activeAccount.value.address)
console.log(activeAccount.value.isConnected)
```

## Parameters

### config

- **Type:** `Config`
- **Optional**

[`Config`](/core/api/createConfig) to use instead of the injected one.

## Examples

### Account switcher

```vue
<script setup>
import { useActiveAccount, useSwitchActiveAccount } from '@growae/reactive-vue'

const activeAccount = useActiveAccount()
const { switchActiveAccount } = useSwitchActiveAccount()
</script>

<template>
  <div v-if="activeAccount.isConnected">
    <button
      v-for="addr in activeAccount.addresses"
      :key="addr"
      :disabled="addr === activeAccount.address"
      @click="switchActiveAccount({ account: addr })"
    >
      {{ addr.slice(0, 10) }}...
      <span v-if="addr === activeAccount.address">(active)</span>
    </button>
  </div>
</template>
```

## Actions

- [`getActiveAccount`](/core/api/actions/getActiveAccount)
- [`watchActiveAccount`](/core/api/actions/watchActiveAccount)

## Related

- [`useSwitchActiveAccount`](/vue/api/composables/useSwitchActiveAccount)
