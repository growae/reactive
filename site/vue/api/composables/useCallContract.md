# useCallContract

Composable for calling a Sophia contract function as an on-chain transaction.

## Import

```typescript
import { useCallContract } from '@reactive/vue'
```

## Usage

```vue
<script setup lang="ts">
import { useCallContract } from '@reactive/vue'

const { mutate: call, isPending } = useCallContract()
</script>

<template>
  <button
    @click="call({
      address: 'ct_token...',
      aci: tokenAci,
      fn: 'transfer',
      args: ['ak_recipient...', 1000n],
    })"
    :disabled="isPending"
  >
    Transfer Tokens
  </button>
</template>
```

## Parameters

See [`callContract` Parameters](/core/api/actions/callContract#parameters).

Key parameters include `ttl` which defaults to `300` blocks.

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Action

- [`callContract`](/core/api/actions/callContract)
