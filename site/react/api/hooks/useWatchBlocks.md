# useWatchBlocks

Poll the current key-block header and deliver a callback when the hash changes.

```tsx
import { useWatchBlocks } from '@growae/reactive-react'

// Inside a React component
useWatchBlocks({
  networkId: 'ae_uat', interval: 5_000, emitOnBegin: true,
  onBlock: (block, previous) => updateHead(block.hash, previous?.hash),
  onError: error => reportError(error),
})
```

The callback sees observed tips, including a replacement at the same height. Several blocks between polls produce a single latest observation. Disabling or unmounting cancels delivery, including results already in flight.
