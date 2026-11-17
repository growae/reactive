# useGasPrice

Read the observed minimum gas price, in aettos per gas unit, for a node reporting window.

```tsx
import { useGasPrice } from '@growae/reactive-react'

// Inside a React component
const price = useGasPrice({ minutes: 5 })
```

With no `minutes`, the shortest available window is used. The result is a decimal string or `null` when the requested sample is absent. A reported price is an observation, not a promise of inclusion.
