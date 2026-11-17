# useConnectorClient

Read the connected wallet’s provider, current account, network and connector.

```tsx
import { useConnectorClient } from '@growae/reactive-react'

// Inside a React component
const wallet = useConnectorClient()
const address = wallet.data?.account
```

Pass `connector` to select a specific open wallet. The query waits for a connection and keys its cache by connector UID, selected account and network. A mismatched explicit `networkId` produces an error.
