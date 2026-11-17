# useMintToken

Request minting from an AEX-9 contract.

```tsx
import { useMintToken } from '@growae/reactive-react'

// Inside a React component
const { mintTokenAsync } = useMintToken()
const submit = () => mintTokenAsync({ token, recipient, quantity: 10n, gasLimit: 60_000, waitMined: true })
```

Use token base units. The token must implement the `mintable` extension and the caller must satisfy its permissions. Pass `waitMined` to check execution.
