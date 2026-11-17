# useNamePointees

List indexed AENS pointers targeting an account.

```tsx
import { useNamePointees } from '@growae/reactive-react'

// Inside a React component
const names = useNamePointees({ address, limit: 25 })
```

Returns the matching records and opaque page cursors. More than one name may point to the same address. Inspect each record’s `active` and `key` fields.
