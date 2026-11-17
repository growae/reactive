# useSendCallsSync

Submit an AE transaction group and wait for inclusion of all its hashes.

```tsx
import { useSendCallsSync } from '@growae/reactive-react'

// Inside a React component
const { sendCallsSyncAsync } = useSendCallsSync()
const submit = () => sendCallsSyncAsync({ calls: unsignedTransactions, timeout: 60_000 })
```

No atomicity is implied. After a wait error, use `CallsWaitError.group` to resume status lookup. After a partial submission, inspect `CallsSubmissionError.group` before trying again.
