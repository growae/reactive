# useNameEntry

Composable for looking up an AENS name entry.

## Import

```typescript
import { useNameEntry } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup lang="ts">
import { useNameEntry } from '@growae/reactive-vue'

const { data: entry, isLoading } = useNameEntry({ name: 'myname.chain' })
</script>

<template>
  <div v-if="isLoading">Looking up name...</div>
  <div v-else>
    <p>Owner: {{ entry?.owner }}</p>
    <p>TTL: {{ entry?.ttl }}</p>
  </div>
</template>
```

## Return Type

### data

- **Type:** `Ref<{ id, owner, pointers, ttl } | undefined>`

The AENS name entry data.

## Parameters

### name

- **Type:** `string | Ref<string>`
- **Required**

The AENS name to look up (e.g. `'myname.chain'`).

### networkId

- **Type:** `string | Ref<string>`
- **Optional**

Target network.

### query

See [TanStack Vue Query docs](https://tanstack.com/query/v5/docs/framework/vue/reference/useQuery) for query options.

## Action

- [`getNameEntry`](/core/api/actions/getNameEntry)
