# useCapabilities

Inspect what the selected connector can do before offering an action.

```tsx
import { useCapabilities } from '@growae/reactive-react'

// Inside a React component
const capabilities = useCapabilities()
const canSignTypedData = capabilities.data?.signTypedData === true
```

The booleans reflect connector methods for signing, switching network, tracking an AEX-9 token and presenting call-group status. A wallet can still decline a supported request.
