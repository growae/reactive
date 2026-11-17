# useWatchHeight

Poll for key-block height changes.

```tsx
import { useWatchHeight } from '@growae/reactive-react'

// Inside a React component
useWatchHeight({ onHeight: height => updateHeight(height), interval: 5_000 })
```

Use `enabled` to stop polling. Use `useWatchBlocks` if the block hash matters, including replacements at the same height.
