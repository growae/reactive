# useCallContract

Build and submit a signed Sophia contract call.

```tsx
import { useCallContract } from '@growae/reactive-react'

// Inside a React component
const { callContractAsync } = useCallContract()
const submit = () => callContractAsync({ address: contract, function: 'set', args: [19n], gasLimit: 50_000 })
```

`function` and explicit FATE `args` are encoded in Rust. Alternatively supply `callData`. The default returns after posting. Pass `waitMined: true` to require successful execution. Money amounts are in aettos.
