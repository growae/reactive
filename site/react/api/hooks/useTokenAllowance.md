# useTokenAllowance

Read an AEX-9 allowances-extension approval through its Sophia contract.

```tsx
import { useTokenAllowance } from '@growae/reactive-react'

// Inside a React component
const allowance = useTokenAllowance({ token, owner, spender })
```

Returns a decimal quantity or `null` for `None`. This hook requires the token’s `allowances` extension and a dry-run-enabled node.
