# useReadContract

Execute a Sophia read through the node’s dry-run endpoint.

```tsx
import { useReadContract } from '@growae/reactive-react'

// Inside a React component
const result = useReadContract({ address: contract, function: 'balance', args: [{ address: owner }] })
```

Pass `function` and FATE `args`, or pre-encoded `callData`. `top` pins a block hash. The query returns the encoded `cb_` result. Use `decodeContractValue` from core to recover its wire value. Reverts reject the query.
