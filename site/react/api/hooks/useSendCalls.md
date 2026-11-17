# useSendCalls

Sign and submit a sequence of explicit unsigned AE transactions using one connected account.

```tsx
import { useSendCalls } from '@growae/reactive-react'

// Inside a React component
const { sendCallsAsync } = useSendCalls()
const submit = () => sendCallsAsync({ calls: unsignedTransactions })
```

Supply distinct, correctly ordered nonces. Submissions are independent. `atomicRequired: true` rejects before signing. Save `{networkId, hashes}`. `CallsSubmissionError.group` includes every attempted POST hash, including one whose acknowledgement may have been lost.
