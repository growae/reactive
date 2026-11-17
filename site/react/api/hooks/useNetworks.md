# useNetworks

Read networks configured for this application.

```tsx
import { useNetworks } from '@growae/reactive-react'

// Inside a React component
const networks = useNetworks()
```

Each network includes its ID, name and node URL. Middleware operations also use `middlewareUrl`.
