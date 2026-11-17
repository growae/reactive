# useTransactionCount

Read the next nonce for an account.

```tsx
import { useTransactionCount } from '@growae/reactive-react'

// Inside a React component
const nextNonce = useTransactionCount({ address })
```

The result is the nonce for a new transaction. It can differ from a count of mined transactions.
