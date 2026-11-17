# useWatchConnectors

Run a callback when the list of configured connectors changes.

```tsx
import { useWatchConnectors } from '@growae/reactive-react'

// Inside a React component
useWatchConnectors({ onChange: connectors => updateList(connectors) })
```

Unmounting removes the subscription. Use `useConnectors` if the component only needs to render the list.
