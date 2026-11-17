# useSpend

Composable for sending AE tokens to a recipient.

## Import

```typescript
import { useSpend } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup lang="ts">
import { useSpend } from '@growae/reactive-vue'

const { mutate: spend, isPending, isSuccess, data } = useSpend()
</script>

<template>
  <button
    @click="spend({ recipient: 'ak_2dA...', amount: 1500000000000000000n })"
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
| `options.ttl` | `number` | current height + 300 | Transaction absolute expiry height. Use `0` for no expiry. |

::: tip Default TTL
Spends default to an expiry 300 key blocks after the current height. Pass `options: { ttl: 0 }` to disable expiry.
:::

## Action

- [`spend`](/core/api/actions/spend)
