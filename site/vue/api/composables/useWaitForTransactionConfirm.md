# useWaitForTransactionConfirm

Composable that waits for a transaction to reach a confirmation depth.

## Import

```typescript
import { useWaitForTransactionConfirm } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup lang="ts">
import { useWaitForTransactionConfirm } from '@growae/reactive-vue'

const props = defineProps<{ txHash: string }>()

const { data: confirmedHeight, isLoading } = useWaitForTransactionConfirm({
  hash: props.txHash,
})
</script>

<template>
  <div v-if="isLoading">Waiting for confirmation...</div>
  <div v-else>Confirmed at height: {{ confirmedHeight }}</div>
</template>
```

## Return Type

### data

- **Type:** `Ref<number | undefined>`

The block height at which the transaction reached the required confirmation depth.

## Parameters

### hash

- **Type:** `string | Ref<string>`
- **Required**

The transaction hash to wait for. The query auto-runs when `hash` is provided.

### confirm

- **Type:** `number`
- **Default:** `3`

Number of key blocks to wait for confirmation.

### interval

- **Type:** `number`
- **Default:** `1000`

Polling interval in milliseconds.

### query

See [TanStack Vue Query docs](https://tanstack.com/query/v5/docs/framework/vue/reference/useQuery) for query options.

## Action

- [`waitForTransactionConfirm`](/core/api/actions/waitForTransactionConfirm)
