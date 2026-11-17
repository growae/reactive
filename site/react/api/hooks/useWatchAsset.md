# useWatchAsset

Ask a compatible wallet to track an AEX-9 contract.

```tsx
import { useWatchAsset } from '@growae/reactive-react'

// Inside a React component
const { watchAssetAsync } = useWatchAsset()
const requestTracking = () => watchAssetAsync({ token })
```

A custom connector must implement `watchAsset`. Bundled connectors do not expose AEX-9 asset tracking. The promise returns the wallet’s boolean decision. Use `useCapabilities` to decide whether to offer the action.
