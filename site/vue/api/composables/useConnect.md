# useConnect

Composable for connecting to a wallet.

## Import

```typescript
import { useConnect } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup lang="ts">
import { useConnect } from '@growae/reactive-vue'

const { connect, connectors, isPending } = useConnect()
</script>

<template>
  <button
    v-for="connector in connectors"
    :key="connector.id"
    @click="connect({ connector })"
    :disabled="isPending"
  >
    {{ connector.name }}
  </button>
</template>
```

## Return Type

```typescript
type UseConnectReturnType = {
  connect: (params: { connector: Connector }) => void
  connectAsync: (params: { connector: Connector }) => Promise<ConnectReturnType>
  connectors: Ref<readonly Connector[]>
  data: Ref<ConnectReturnType | undefined>
  error: Ref<ConnectErrorType | null>
  isPending: Ref<boolean>
  isSuccess: Ref<boolean>
  isError: Ref<boolean>
  reset: () => void
}
```

## Action

- [`connect`](/core/api/actions/connect)
