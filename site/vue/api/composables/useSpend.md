# useSpend

Composable for sending AE tokens to a recipient.

## Import

```typescript
import { useSpend } from '@reactive/vue'
```

## Usage

```vue
<script setup lang="ts">
import { useSpend } from '@reactive/vue'

const { mutate: spend, isPending, isSuccess, data } = useSpend()
</script>

<template>
  <button
    @click="spend({ recipient: 'ak_2dA...', amount: '1.5' })"
    :disabled="isPending"
  >
    Send 1.5 AE
  </button>
  <p v-if="isSuccess">Tx: {{ data.hash }}</p>
</template>
```

## Parameters

See [`spend` Parameters](/core/api/actions/spend#parameters).

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `recipient` | `string` | — | Required. Recipient address or AENS name. |
| `amount` | `bigint \| string` | — | Required. Amount to send. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Action

- [`spend`](/core/api/actions/spend)
