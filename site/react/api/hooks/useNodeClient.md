# useNodeClient

Get the v3 node client for a configured network.

```tsx
import { useNodeClient } from '@growae/reactive-react'

// Inside a React component
const node = useNodeClient({ networkId: 'ae_uat' })
```

The client is memoized per configured network. Use it for node reads outside a query hook.
