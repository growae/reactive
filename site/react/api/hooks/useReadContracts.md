# useReadContracts

Read several Sophia calls in one node dry-run.

```tsx
import { useReadContracts } from '@growae/reactive-react'

// Inside a React component
const result = useReadContracts({ contracts: [
  { address: token, function: 'meta_info' },
  { address: token, function: 'balance', args: [{ address: owner }] },
] })
```

The results are `cb_` values in input order. All items use the same network and optional `top`. A failed item rejects the query. An empty list sends no node request.
