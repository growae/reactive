# Wallet connectors

A connector supplies accounts and signs for a configured network. Import `metamaskSnap` from `@growae/reactive-connectors` for a browser with MetaMask and the æternity Snap. Import `memory`, `mock`, or `createConnector` from `@growae/reactive` for local signing, tests, or your own wallet.

```ts
import { createConfig, testnet } from '@growae/reactive'
import { metamaskSnap } from '@growae/reactive-connectors'

const config = createConfig({ networks: [testnet], connectors: [metamaskSnap()] })
```

A connector must use the account named by `onAccount` or throw. The memory connector signs through Rust and returns only the address from `getProvider()`. Keep private keys outside browser bundles. [Migration and supported APIs](../rust-protocol)
