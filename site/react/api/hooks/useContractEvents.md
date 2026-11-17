# useContractEvents

Read one page of contract logs from the configured æternity middleware.

```tsx
import { useContractEvents } from '@growae/reactive-react'

// Inside a React component
const logs = useContractEvents({ address: token, event: 'Transfer', fromHeight: 10, toHeight: 20, limit: 50 })
```

Supply both ends of a height range or neither. `data` contains the events, `nextCursor` and `previousCursor` page the filtered query. Middleware indexing may lag the node.
