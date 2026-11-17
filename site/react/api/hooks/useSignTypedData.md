# useSignTypedData

Sign AE typed data using the selected wallet and the Rust FATE domain encoding.

```tsx
import { useSignTypedData } from '@growae/reactive-react'

// Inside a React component
const { signTypedDataAsync } = useSignTypedData()
const sign = () => signTypedDataAsync({ data, aci, domain: { name: 'My app', version: 1 } })
```

`data` is a FATE-encoded `cb_` value and `aci` is its JSON type. The network is pinned to the connected wallet. The memory connector supports this operation. Check `useCapabilities` for other wallets. Returns an `sg_` signature.
