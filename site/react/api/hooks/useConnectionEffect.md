# useConnectionEffect

Run callbacks when the app gains its first connected wallet or loses its last connection.

```tsx
import { useConnectionEffect } from '@growae/reactive-react'

// Inside a React component
useConnectionEffect({
  onConnect: ({ activeAccount, isReconnected }) => onWalletReady(activeAccount, isReconnected),
  onDisconnect: () => clearWalletUI(),
})
```

Subscribing after a wallet is already connected does not replay a connect event. Switching among open wallets or selecting another account leaves the callbacks idle. Unmounting unsubscribes.
