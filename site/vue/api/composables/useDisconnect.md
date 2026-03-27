# useDisconnect

Composable for disconnecting the current wallet.

## Import

```typescript
import { useDisconnect } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup lang="ts">
import { useDisconnect } from '@growae/reactive-vue'

const { disconnect } = useDisconnect()
</script>

<template>
  <button @click="disconnect()">Disconnect</button>
</template>
```

## Return Type

```typescript
type UseDisconnectReturnType = {
  disconnect: () => void
  disconnectAsync: () => Promise<void>
  isPending: Ref<boolean>
  isSuccess: Ref<boolean>
  isError: Ref<boolean>
}
```
