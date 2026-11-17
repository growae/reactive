# useSimulateContract

Simulate a Sophia contract call and inspect gas, logs and its execution result.

```tsx
import { useSimulateContract } from '@growae/reactive-react'

// Inside a React component
const simulation = useSimulateContract({ address: contract, function: 'echo', args: [19n] })
```

Returns the node’s call object with `gasUsed`, `returnType`, and encoded `returnValue`. Call-level error or revert remains visible in `returnType`. A failed node dry-run rejects the query.
