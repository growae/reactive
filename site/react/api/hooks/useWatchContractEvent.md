# useWatchContractEvent

Watch indexed Sophia event logs for one contract.

```tsx
import { useWatchContractEvent } from '@growae/reactive-react'

// Inside a React component
useWatchContractEvent({ address: token, event: 'Transfer', onLogs: logs => appendEvents(logs) })
```

The first poll establishes a baseline unless `fromHeight` is provided. The watcher follows every page, rescans the boundary height and suppresses repeated logs. Replaced logs can produce new observations; consumers needing finality should recheck the canonical chain.
