# useSignMessage

Composable for signing an arbitrary message with the connected account.

## Import

```typescript
import { useSignMessage } from '@reactive/vue'
```

## Usage

```vue
<script setup lang="ts">
import { useSignMessage } from '@reactive/vue'

const { mutate: sign, data } = useSignMessage()
</script>

<template>
  <button @click="sign({ message: 'Hello, Aeternity!' })">
    Sign Message
  </button>
  <p v-if="data">Signature: {{ data.signature }}</p>
</template>
```

## Parameters

See [`signMessage` Parameters](/core/api/actions/signMessage#parameters).

## Action

- [`signMessage`](/core/api/actions/signMessage)
