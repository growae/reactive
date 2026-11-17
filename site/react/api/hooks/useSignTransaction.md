# useSignTransaction

Ask a wallet to sign an encoded æternity transaction.

```tsx
import { useSignTransaction } from '@growae/reactive-react'

// Inside a React component
const { signTransactionAsync } = useSignTransaction()
const sign = () => signTransactionAsync({ tx: unsignedTx })
```

The active account is selected by default. `onAccount` pins an explicit signer. The result is a signed `tx_` envelope.
