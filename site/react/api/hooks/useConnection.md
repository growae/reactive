# useConnection

Subscribe to the currently selected wallet connection.

```tsx
import { useConnection } from '@growae/reactive-react'

// Inside a React component
const current = useConnection()
```

The result is `undefined` while disconnected and includes the selected account, connector and network when connected.
