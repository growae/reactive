# useMicroBlock

Composable for fetching a micro block by hash.

## Import

```typescript
import { useMicroBlock } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup lang="ts">
import { useMicroBlock } from '@growae/reactive-vue'

const props = defineProps<{ blockHash: string }>()

const { data: block, isLoading } = useMicroBlock({ hash: props.blockHash })
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else>
    <p>Height: {{ block?.height }}</p>
    <p>Transactions: {{ block?.transactions?.length }}</p>
  </div>
</template>
```

## Return Type

### data

- **Type:** `Ref<{ hash, height, time, transactions, ... } | undefined>`

The micro block data.

## Parameters

### hash

- **Type:** `string | Ref<string>`
- **Required**

The micro block hash to fetch.

### networkId

- **Type:** `string | Ref<string>`
- **Optional**

Target network.

### query

See [TanStack Vue Query docs](https://tanstack.com/query/v5/docs/framework/vue/reference/useQuery) for query options.

## Action

- [`getMicroBlock`](/core/api/actions/getMicroBlock)
