# useEstimateGas

Dry-run an encoded transaction to obtain the gas used by contract execution.

```tsx
import { useEstimateGas } from '@growae/reactive-react'

// Inside a React component
const estimate = useEstimateGas({ tx: encodedContractTransaction })
```

Optional `accounts` supply hypothetical balances for this simulation. `top` pins the chain state. A dry-run failure or contract revert is a query error. Use a node that enables `/v3/dry-run`.
