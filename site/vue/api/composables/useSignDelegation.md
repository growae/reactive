# useSignDelegation

Composable for signing delegation transactions.

## Import

```typescript
import { useSignDelegation } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup lang="ts">
import { useSignDelegation } from '@growae/reactive-vue'

const { mutate: signDelegation, isPending, data } = useSignDelegation()
</script>

<template>
  <button @click="signDelegation({ delegation: packed })" :disabled="isPending">
    Sign Delegation
  </button>
  <p v-if="data">Signature: {{ data }}</p>
</template>
```

## Parameters

See [`signDelegation` Parameters](/core/api/actions/signDelegation#parameters).

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `delegation` | `any` | — | Required. The packed delegation to sign. |
| `networkId` | `string` | — | Optional. Target network. |
| `account` | `string` | — | Optional. Account address to sign with. |
| `connector` | `Connector` | — | Optional. Connector to use for signing. |

## Action

- [`signDelegation`](/core/api/actions/signDelegation)
