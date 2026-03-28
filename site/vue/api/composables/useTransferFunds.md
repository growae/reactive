# useTransferFunds

Composable for transferring a fraction of account balance to a recipient.

## Import

```typescript
import { useTransferFunds } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup lang="ts">
import { useTransferFunds } from '@growae/reactive-vue'

const { mutate: transferFunds, isPending, isSuccess, data } = useTransferFunds()
</script>

<template>
  <button
    @click="transferFunds({ fraction: 0.5, recipient: 'ak_...' })"
    :disabled="isPending"
  >
    Transfer 50%
  </button>
  <p v-if="isSuccess">Tx: {{ data.hash }}</p>
</template>
```

## Parameters

See [`transferFunds` Parameters](/core/api/actions/transferFunds#parameters).

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `fraction` | `number` | — | Required. Fraction of balance to transfer (0–1). |
| `recipient` | `string` | — | Required. Recipient address (`ak_...`). |
| `ttl` | `number` | `300` | Transaction TTL in blocks. |
| `waitMined` | `boolean` | `true` | Whether to wait for the transaction to be mined. |

## Action

- [`transferFunds`](/core/api/actions/transferFunds)
