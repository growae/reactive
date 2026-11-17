# useTokenBalance

Read the indexed balance of an AEX-9 account.

```tsx
import { useTokenBalance } from '@growae/reactive-react'

// Inside a React component
const balance = useTokenBalance({ token, address: owner })
```

Reads the configured middleware. `amount` is a decimal string in the token’s smallest unit. Use `useTokenMetadata` for decimals. Missing indexed records surface as errors.
