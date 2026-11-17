# useDeployContract

Build, sign and submit a Sophia deployment with the Rust protocol core.

```tsx
import { useDeployContract } from '@growae/reactive-react'

// Inside a React component
const { deployContractAsync } = useDeployContract()
const deploy = () => deployContractAsync({ bytecode, function: 'init', args: [], gasLimit: 100_000, waitMined: true })
```

Supply compiled `cb_` bytecode and a gas limit. The result includes the derived `ct_` address and transaction hash. With `waitMined`, the hook verifies execution success. A confirmation error carries the submitted hash.
