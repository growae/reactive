# useAccount

Read chain account data for an address or the active wallet account.

```tsx
import { useAccount } from '@growae/reactive-react'

// Inside a React component
const account = useAccount({ address })
```

The result contains the balance in aettos, nonce and account kind. Use `useConnection` for wallet connection state.
