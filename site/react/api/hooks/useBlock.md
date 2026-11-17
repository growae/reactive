# useBlock

Read a key-block header by height, hash, or the current tip.

```tsx
import { useBlock } from '@growae/reactive-react'

// Inside a React component
const block = useBlock({ height: 100 })
```

Key blocks describe a generation. Use `useMicroBlock` for a micro block’s transactions.
