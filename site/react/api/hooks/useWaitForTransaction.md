# useWaitForTransaction

Wait for a submitted transaction to appear in a micro block.

```tsx
import { useWaitForTransaction } from '@growae/reactive-react'

// Inside a React component
const mined = useWaitForTransaction({ hash, timeout: 60_000 })
```

Returns the inclusion hash, height and transaction. Use `useWaitForTransactionReceipt` for contract results.
