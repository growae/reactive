# useMinimumFee

Calculate the protocol minimum transaction fee locally through Rust.

```tsx
import { useMinimumFee } from '@growae/reactive-react'

// Inside a React component
const fee = useMinimumFee({ tag: 'SpendTx', fields: spendFields })
```

Supply ordinary builder fields including the nonce. The result is a decimal string in aettos. For contracts supply gas limit, gas price, and calldata. Use `useGasPrice` for recent network prices.
