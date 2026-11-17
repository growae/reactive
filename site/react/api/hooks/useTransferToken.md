# useTransferToken

Transfer AEX-9 units from the selected account.

```tsx
import { useTransferToken } from '@growae/reactive-react'

// Inside a React component
const { transferTokenAsync } = useTransferToken()
const submit = () => transferTokenAsync({ token, recipient, quantity: 10n, gasLimit: 60_000, waitMined: true })
```

Use token base units. The contract must implement the AEX-9 transfer entry point. Pass `waitMined` to check execution.
