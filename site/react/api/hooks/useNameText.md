# useNameText

Read a UTF-8 text value from an AENS raw data pointer.

```tsx
import { useNameText } from '@growae/reactive-react'

// Inside a React component
const text = useNameText({ name: 'example.chain', key: 'profile' })
```

Returns `null` for a missing name, missing key, or non-byte pointer. Malformed UTF-8 and transport failures are query errors.
