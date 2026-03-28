# useBuildTransaction

Composable for building unsigned transactions.

## Import

```typescript
import { useBuildTransaction } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup lang="ts">
import { useBuildTransaction } from '@growae/reactive-vue'
import { Tag } from '@aeternity/aepp-sdk'

const { mutate: buildTransaction, data } = useBuildTransaction()
</script>

<template>
  <button
    @click="buildTransaction({
      tag: Tag.SpendTx,
      senderId: 'ak_...',
      recipientId: 'ak_...',
      amount: 1000000000000000000n,
    })"
  >
    Build Transaction
  </button>
  <p v-if="data">Unsigned Tx: {{ data }}</p>
</template>
```

## Parameters

See [`buildTransaction` Parameters](/core/api/actions/buildTransaction#parameters).

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tag` | `Tag` | — | Required. Transaction type tag (e.g. `Tag.SpendTx`). |
| `networkId` | `string` | — | Optional. Target network. |

Additional transaction-specific fields depend on the chosen `tag`.

## Action

- [`buildTransaction`](/core/api/actions/buildTransaction)
