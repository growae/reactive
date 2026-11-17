# useShowCallsStatus

Ask a compatible connector to present its own transaction-group status UI.

```tsx
import { useShowCallsStatus } from '@growae/reactive-react'

// Inside a React component
const { showCallsStatusAsync } = useShowCallsStatus()
const show = () => showCallsStatusAsync({ group })
```

Requires a custom connector implementing `showCallsStatus`. The bundled connectors have no such UI. Check `useCapabilities().data?.showCallsStatus` before showing the button. For an app-owned view, render `useCallsStatus`.
