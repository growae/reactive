# useBurnToken

Burn units held by the selected caller.

```tsx
import { useBurnToken } from '@growae/reactive-react'

// Inside a React component
const { burnTokenAsync } = useBurnToken()
const submit = () => burnTokenAsync({ token, quantity: 10n, gasLimit: 60_000, waitMined: true })
```

Use token base units. The token must implement the `burnable` extension and the caller must satisfy its permissions. Pass `waitMined` to check execution.
