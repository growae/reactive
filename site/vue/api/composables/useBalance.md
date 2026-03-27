# useBalance

Composable for fetching the AE balance of an address.

## Import

```typescript
import { useBalance } from '@reactive/vue'
```

## Usage

```vue
<script setup lang="ts">
import { useBalance } from '@reactive/vue'

const { data, isLoading, error } = useBalance({
  address: 'ak_2dATGVvfU1oBShDDsaqfh1sF4bCkx2FKbiCaL2t4zZpMMpMfgE',
})
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">Error: {{ error.shortMessage }}</div>
  <div v-else>{{ data.ae }} AE</div>
</template>
```

## Return Type

See [TanStack Vue Query docs](https://tanstack.com/query/v5/docs/framework/vue/reference/useQuery) for full return type. All values are Vue `Ref`s.

### data

See [`getBalance` Return Type](/core/api/actions/getBalance#return-type).

## Parameters

### address

- **Type:** `string | Ref<string>`
- **Required**

The account address. Accepts reactive refs.

### query

See [TanStack Vue Query docs](https://tanstack.com/query/v5/docs/framework/vue/reference/useQuery) for query options.

## Action

- [`getBalance`](/core/api/actions/getBalance)
