# useTransactionReceipt

Read a mined transaction and its execution info where available.

```tsx
import { useTransactionReceipt } from '@growae/reactive-react'

// Inside a React component
const receipt = useTransactionReceipt({ hash })
```

A pending transaction returns `null`; an unknown hash is a node error. Contract calls and creations include `execution.callInfo`. Check `returnType` for success, error or revert. Ordinary transfers have `execution: null`.
