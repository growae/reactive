# useVerifyTypedData

Verify an AE typed-data signature against its ACI type and domain.

```tsx
import { useVerifyTypedData } from '@growae/reactive-react'

// Inside a React component
const verified = useVerifyTypedData({ address, signature, data, aci, domain: { name: 'My app', version: 1 } })
```

Use the same domain and network as signing. Changing the network, domain or ACI changes the digest. Returns a boolean.
