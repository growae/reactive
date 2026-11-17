# useWriteContractSync

Submit a Sophia contract call and wait for successful execution.

```tsx
import { useWriteContractSync } from '@growae/reactive-react'

// Inside a React component
const { writeContractSyncAsync } = useWriteContractSync()
const submit = () => writeContractSyncAsync({ address: contract, function: 'set', args: [19n], gasLimit: 50_000 })
```

Returns the hash and mined call info. A timeout, revert or execution error after submission includes the hash for reconciliation.
