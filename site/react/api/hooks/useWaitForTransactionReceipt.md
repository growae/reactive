# useWaitForTransactionReceipt

Wait for inclusion of a known transaction hash, then read execution information.

```tsx
import { useWaitForTransactionReceipt } from '@growae/reactive-react'

// Inside a React component
const receipt = useWaitForTransactionReceipt({ hash, timeout: 60_000 })
```

`timeout` and `interval` are milliseconds. The receipt query cancels its requests on unsubscribe. A mined contract can still report an execution error or revert.
