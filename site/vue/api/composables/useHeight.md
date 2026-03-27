# useHeight

Composable for fetching the current block height.

## Import

```typescript
import { useHeight } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup lang="ts">
import { useHeight } from '@growae/reactive-vue'

const { data: height, isLoading } = useHeight()
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else>Current height: {{ height }}</div>
</template>
```

## Return Type

### data

- **Type:** `Ref<number | undefined>`

The current key block height.

## Parameters

### networkId

- **Type:** `string | Ref<string>`
- **Optional**

Target network.

### query

See [TanStack Vue Query docs](https://tanstack.com/query/v5/docs/framework/vue/reference/useQuery) for query options.
