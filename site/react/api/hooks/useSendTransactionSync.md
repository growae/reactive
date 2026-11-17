# useSendTransactionSync

Post already-signed transaction bytes and wait for inclusion.

```tsx
import { useSendTransactionSync } from '@growae/reactive-react'

// Inside a React component
const { sendTransactionSyncAsync } = useSendTransactionSync()
const submit = () => sendTransactionSyncAsync({ tx: signedTx, timeout: 60_000 })
```

Call `submit` from a user action. The timeout bounds the wait after posting. A timeout can occur after the node has accepted the transaction.
