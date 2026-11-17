# useConnectors

Read the configured wallet connectors and subscribe to changes.

```tsx
import { useConnectors } from '@growae/reactive-react'

// Inside a React component
const connectors = useConnectors()
```

A configured connector can exist before the user opens a connection.
