# Multi-Account Support

Reactive has first-class support for wallets with multiple accounts. The active account is tracked in core state and automatically propagated to all hooks.

## Overview

When a wallet connects with multiple accounts, `@growae/reactive` tracks which one is **active** (the account used for signing). The active account defaults to the first account provided by the wallet, and can change when:

1. The user explicitly calls `switchActiveAccount`
2. The wallet itself pushes an account change event (e.g. the user switches accounts in Superhero Wallet)

## Concepts

### `activeAccount`

Every `Connection` in state has an `activeAccount: string` field — the address currently selected for signing. All transaction actions (`spend`, `callContract`, etc.) use this address automatically.

### `accounts`

The full list of addresses provided by the wallet. The `activeAccount` is always one of these.

## Core Actions

### Reading the active account

```typescript
import { getActiveAccount } from '@growae/reactive'

const result = getActiveAccount(config)

if (result.isConnected) {
  console.log(result.address)   // currently active: 'ak_...'
  console.log(result.addresses) // all accounts from the wallet
}
```

### Switching the active account

```typescript
import { switchActiveAccount } from '@growae/reactive'

// Switch to a different account from the wallet's list
switchActiveAccount(config, { account: 'ak_abc...' })
```

### Watching for changes

```typescript
import { watchActiveAccount } from '@growae/reactive'

const unwatch = watchActiveAccount(config, {
  onChange(activeAccount) {
    console.log('Active account changed to:', activeAccount.address)
  },
})
```

## React

```tsx
import { useActiveAccount, useSwitchActiveAccount } from '@growae/reactive-react'

function AccountSwitcher() {
  const { address, addresses, isConnected } = useActiveAccount()
  const { switchActiveAccount } = useSwitchActiveAccount()

  if (!isConnected) return <p>Not connected</p>

  return (
    <div>
      <p>Active: {address}</p>
      {addresses.map((addr) => (
        <button
          key={addr}
          onClick={() => switchActiveAccount({ account: addr })}
          disabled={addr === address}
        >
          {addr.slice(0, 10)}...
        </button>
      ))}
    </div>
  )
}
```

### Optional address in hooks

Hooks that require an address (like `useBalance`) now default to the active account automatically:

```tsx
// Before — always needed to pass address explicitly
const { data } = useBalance({ address: 'ak_...' })

// After — uses connected active account automatically
const { data } = useBalance()

// Still works with explicit override
const { data } = useBalance({ address: 'ak_other...' })
```

This applies to: `useBalance`, `useAccount`.

## Vue

```vue
<script setup>
import { useActiveAccount, useSwitchActiveAccount } from '@growae/reactive-vue'

const activeAccount = useActiveAccount()
const { switchActiveAccount } = useSwitchActiveAccount()
</script>

<template>
  <div v-if="activeAccount.isConnected">
    <p>Active: {{ activeAccount.address }}</p>
    <button
      v-for="addr in activeAccount.addresses"
      :key="addr"
      @click="switchActiveAccount({ account: addr })"
      :disabled="addr === activeAccount.address"
    >
      {{ addr.slice(0, 10) }}...
    </button>
  </div>
</template>
```

## Solid

```tsx
import { useActiveAccount, useSwitchActiveAccount } from '@growae/reactive-solid'

function AccountSwitcher() {
  const activeAccount = useActiveAccount()
  const { switchActiveAccount } = useSwitchActiveAccount()

  return (
    <Show when={activeAccount().isConnected}>
      <p>Active: {activeAccount().address}</p>
      <For each={activeAccount().addresses}>
        {(addr) => (
          <button
            onClick={() => switchActiveAccount({ account: addr })}
            disabled={addr === activeAccount().address}
          >
            {addr.slice(0, 10)}...
          </button>
        )}
      </For>
    </Show>
  )
}
```

## How account changes propagate

```
Wallet emits accountsChange
  → Connector emits 'change' event
    → createConfig reconciles activeAccount
      → watchActiveAccount subscribers fire
        → useActiveAccount() re-renders
          → useBalance() / useAccount() re-fetch with new address
```

If the active account is still in the new list, it is kept. Otherwise it falls back to `accounts[0]`.
