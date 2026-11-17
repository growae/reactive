# useNameAvatar

Read an application-defined avatar pointer from an AENS name.

```tsx
import { useNameAvatar } from '@growae/reactive-react'

// Inside a React component
const avatar = useNameAvatar({ name: 'example.chain', key: 'avatar' })
```

Returns the UTF-8 pointer text or `null`. `avatar` is an application convention. This hook does not fetch the referenced resource.
