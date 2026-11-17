# useInfiniteReadContracts

Page through batches of Sophia reads using a caller-defined cursor.

```tsx
import { useInfiniteReadContracts } from '@growae/reactive-react'

// Inside a React component
const pages = useInfiniteReadContracts({
  cacheKey: [token, owners], initialPageParam: 0,
  contracts: offset => owners.slice(offset, offset + 10).map(owner => ({ address: token, function: 'balance', args: [{ address: owner }] })),
  getNextPageParam: (_last, _pages, offset) => offset + 10 < owners.length ? offset + 10 : undefined,
})
```

Call `pages.fetchNextPage()` to fetch another batch. Include all inputs that change the page definition in `cacheKey`. Pass a common `top` to make all pages use the same block.
