# useTransaction

Fetch a transaction by its `th_` hash.

```tsx
import { useTransaction } from '@growae/reactive-react'

// Inside a React component
const transaction = useTransaction({ hash })
```

A block height of `-1` denotes a pending transaction. Use `useTransactionReceipt` for mined execution information.
