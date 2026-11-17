# useWatchPendingTransactions

Observe newly seen pending transaction hashes for an account.

```tsx
import { useWatchPendingTransactions } from '@growae/reactive-react'

// Inside a React component
useWatchPendingTransactions({ address, onTransactions: hashes => showPending(hashes) })
```

The node endpoint is scoped to one account. The first snapshot establishes a baseline unless `emitOnBegin` is true. A transaction can disappear from the pool or be mined between polls. `interval` is in milliseconds.
