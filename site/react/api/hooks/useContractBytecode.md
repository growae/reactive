# useContractBytecode

Read a deployed contract’s encoded bytecode.

```tsx
import { useContractBytecode } from '@growae/reactive-react'

// Inside a React component
const code = useContractBytecode({ address: contract })
```

The query reads the node’s contract code endpoint for the selected network.
