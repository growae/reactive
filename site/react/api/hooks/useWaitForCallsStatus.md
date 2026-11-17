# useWaitForCallsStatus

Wait for all hashes in an AE group to be included.

```tsx
import { useWaitForCallsStatus } from '@growae/reactive-react'

// Inside a React component
const status = useWaitForCallsStatus({ group, timeout: 60_000, interval: 1_000 })
```

Polling is bounded and cancels on unsubscribe. An unknown hash remains unresolved until it is included or the wait expires. The result preserves the group for subsequent queries.
