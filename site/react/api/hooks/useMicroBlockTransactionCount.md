# useMicroBlockTransactionCount

Read the number of transactions in one micro block. Pass its `mh_` hash. The action uses the node’s count endpoint, so an empty micro block returns zero and the transaction list stays on the node.

```tsx
import { useMicroBlockTransactionCount } from '@growae/reactive-react'

function Count({ microBlockHash }: { microBlockHash?: string }) {
  const { data, error } = useMicroBlockTransactionCount({ hash: microBlockHash })
  if (error) return <span>{error.message}</span>
  return <span>{data ?? '…'} transactions</span>
}
```

The query waits for a hash. Set `networkId` to choose a configured network, `config` to override the provider, or `enabled: false` to pause automatic reads. The query key includes both hash and network. Call `refetch()` for a fresh observation.
