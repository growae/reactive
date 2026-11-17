# useWatchConnection

Observe changes to the selected wallet connection.

```tsx
import { useWatchConnection } from '@growae/reactive-react'

// Inside a React component
useWatchConnection({ onChange: change => updateSelection(change) })
```

For a component that renders the selected connection use `useConnection`. For connect and disconnect lifecycle callbacks use `useConnectionEffect`.
