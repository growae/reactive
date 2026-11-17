# useTransactionConfirmations

Read the inclusion depth of a transaction from its `th_` hash. A pending transaction returns zero. The key-block height containing it counts as one confirmation and each subsequent height adds one. A node lookup error, including an unknown hash, appears in `error`.

```tsx
import { useTransactionConfirmations } from '@growae/reactive-react'

function Count({ transactionHash }: { transactionHash?: string }) {
  const { data, error } = useTransactionConfirmations({ hash: transactionHash })
  if (error) return <span>{error.message}</span>
  return <span>{data ?? '…'} confirmations</span>
}
```

The query waits for a hash. Set `networkId` to choose a configured network, `config` to override the provider, or `enabled: false` to pause automatic reads. The query key includes both hash and network. Call `refetch()` for a fresh observation.
