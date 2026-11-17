# useFeeHistory

Read the node’s recent gas-price and utilization windows.

```tsx
import { useFeeHistory } from '@growae/reactive-react'

// Inside a React component
const samples = useFeeHistory({ networkId: 'ae_uat' })
```

Each sample includes `minutes`, `utilization` and `minGasPrice` as a decimal string. The node chooses its reporting windows.
