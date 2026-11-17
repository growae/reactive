# useCreateTokenAllowance

Create an allowance for a spender using the AEX-9 allowances extension.

```tsx
import { useCreateTokenAllowance } from '@growae/reactive-react'

// Inside a React component
const { createTokenAllowanceAsync } = useCreateTokenAllowance()
const submit = () => createTokenAllowanceAsync({ token, spender, quantity: 10n, gasLimit: 60_000, waitMined: true })
```

Use token base units. The caller must satisfy the token’s permissions. Pass `waitMined` to check execution. To change an existing allowance by a signed amount, pass `change_allowance` and `[{ address: spender }, delta]` to the contract write hook. To clear it, call `reset_allowance` with the spender. [Contract writes](./useWriteContract) · [AEX-9 allowances](https://github.com/aeternity/AEXs/blob/master/AEXS/aex-9.md#extension-allowances-allowances)
