# useTokenMetadata

Read indexed AEX-9 token metadata and declared extensions.

```tsx
import { useTokenMetadata } from '@growae/reactive-react'

// Inside a React component
const tokenInfo = useTokenMetadata({ token })
```

Includes the token name, symbol and decimals. Check `extensions` before offering extension-specific writes.
