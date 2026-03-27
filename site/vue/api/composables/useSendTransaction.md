# useSendTransaction

Composable for sending a signed transaction to the network.

## Import

```typescript
import { useSendTransaction } from '@reactive/vue'
```

## Usage

```vue
<script setup lang="ts">
import { useSendTransaction } from '@reactive/vue'

const { mutate: send, isPending } = useSendTransaction()
</script>

<template>
  <button @click="send({ tx: signedTx })" :disabled="isPending">
    Send Transaction
  </button>
</template>
```

## Parameters

### ttl

- **Type:** `number`
- **Default:** `300`

Transaction TTL in blocks relative to current height. Set to `0` for no expiration.

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Action

- [`sendTransaction`](/core/api/actions/sendTransaction)
