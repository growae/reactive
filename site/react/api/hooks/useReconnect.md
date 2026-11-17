# useReconnect

Ask previously authorized connectors to reconnect.

```tsx
import { useReconnect } from '@growae/reactive-react'

// Inside a React component
const { reconnectAsync } = useReconnect()
const restore = () => reconnectAsync({})
```

Run the mutation from a user action or use provider reconnect behavior at startup.
