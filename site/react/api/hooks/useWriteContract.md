# useWriteContract

Build and submit a signed Sophia contract call.

```tsx
import { useWriteContract } from '@growae/reactive-react'

// Inside a React component
const { writeContractAsync } = useWriteContract()
const submit = () => writeContractAsync({ address: contract, function: 'set', args: [19n], gasLimit: 50_000 })
```

`function` and explicit FATE `args` are encoded in Rust. Alternatively supply `callData`. The default returns after posting. Pass `waitMined: true` to require successful execution. Money amounts are in aettos.
