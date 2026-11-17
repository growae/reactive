# useContractProof

Fetch the node’s encoded proof of inclusion for a contract.

```tsx
import { useContractProof } from '@growae/reactive-react'

// Inside a React component
const proof = useContractProof({ address: contract })
```

Returns the node’s `poi` string. Proof verification against a trusted state root is a separate operation.
