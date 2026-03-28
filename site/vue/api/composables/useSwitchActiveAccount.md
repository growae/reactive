# useSwitchActiveAccount

Composable for switching the active account to a different one from the connected wallet.

## Import

```typescript
import { useSwitchActiveAccount } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup>
import { useActiveAccount, useSwitchActiveAccount } from '@growae/reactive-vue'

const activeAccount = useActiveAccount()
const { switchActiveAccount, isPending, error } = useSwitchActiveAccount()
</script>

<template>
  <div v-if="activeAccount.isConnected">
    <button
      v-for="addr in activeAccount.addresses"
      :key="addr"
      :disabled="addr === activeAccount.address || isPending"
      @click="switchActiveAccount({ account: addr })"
    >
      {{ addr.slice(0, 10) }}...
    </button>
    <p v-if="error">{{ error.message }}</p>
  </div>
</template>
```

## Return Type

```typescript
type UseSwitchActiveAccountReturnType = {
  switchActiveAccount: (params: { account: string }) => void
  switchActiveAccountAsync: (params: { account: string }) => Promise<void>
  isPending: Ref<boolean>
  error: Ref<Error | null>
}
```

### switchActiveAccount

Switches the active account synchronously. Throws `AccountNotFoundError` if the address is not in the wallet's account list.

### switchActiveAccountAsync

Async variant — returns a Promise.

## Parameters

### config

- **Type:** `Config`
- **Optional**

[`Config`](/core/api/createConfig) to use instead of the injected one.

## Actions

- [`switchActiveAccount`](/core/api/actions/switchActiveAccount)

## Related

- [`useActiveAccount`](/vue/api/composables/useActiveAccount)
