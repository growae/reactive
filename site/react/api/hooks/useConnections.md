# useConnections

Subscribe to open wallet connections.

```tsx
import { useConnections } from '@growae/reactive-react'

// Inside a React component
const wallets = useConnections()
```

The map is keyed by connector UID. Use `useSwitchConnection` to select a member.
