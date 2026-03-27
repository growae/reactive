# useReadContract

Composable for reading Sophia contract state via dry-run.

## Import

```typescript
import { useReadContract } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup lang="ts">
import { useReadContract } from '@growae/reactive-vue'

const { data: balance } = useReadContract({
  address: 'ct_token...',
  aci: tokenAci,
  fn: 'balance',
  args: ['ak_owner...'],
})
</script>

<template>
  <div>Token balance: {{ balance }}</div>
</template>
```

## Parameters

See [`readContract` Parameters](/core/api/actions/readContract#parameters).

### query

See [TanStack Vue Query docs](https://tanstack.com/query/v5/docs/framework/vue/reference/useQuery) for query options.

## Action

- [`readContract`](/core/api/actions/readContract)
