# useCallsStatus

Read inclusion status for a saved AE transaction group.

```tsx
import { useCallsStatus } from '@growae/reactive-react'

// Inside a React component
const status = useCallsStatus({ group })
```

`transactions` is in submission order. Each hash can be `unknown`, `pending` or `included`. Inclusion alone does not prove a contract call succeeded.
