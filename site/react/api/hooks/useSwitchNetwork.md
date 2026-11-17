# useSwitchNetwork

Change the active network to one in the configuration.

```tsx
import { useSwitchNetwork } from '@growae/reactive-react'

// Inside a React component
const { switchNetworkAsync } = useSwitchNetwork()
const switchToTestnet = () => switchNetworkAsync({ networkId: 'ae_uat' })
```

The action requests a network switch from the current connector when it supports switching.
