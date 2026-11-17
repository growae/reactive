# useVerifyMessage

Verify an AE-framed message signature for the claimed account.

```tsx
import { useVerifyMessage } from '@growae/reactive-react'

// Inside a React component
const verified = useVerifyMessage({ address, message: 'hello', signature })
```

Accepts the hex signature or signature bytes returned by message signing. The query resolves to a boolean.
