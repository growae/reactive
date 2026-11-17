# Rust protocol and migration

Reactive 0.2 is a smaller SDK-free toolkit. JavaScript loads the Rust protocol core on demand from the core npm package. Python and Dart call the same Rust crate through native bindings. For a wallet or feature retained only in 0.1, pin the matching packages to 0.1.0 while migrating.

## Hook additions after the 0.2 baseline

The working tree now includes Rust FATE calldata, contract reads, simulation and deployment, typed-data signing, account and block watchers, indexed AENS and AEX-9 reads, and wallet-aware transaction groups. Python and Dart continue to use their existing native transaction APIs. [React hook crosswalk](/react/wagmi-hooks) · [Sophia calls](./sophia-contracts)

## Supported in the original 0.2 baseline

- Configure networks, read balances, accounts, key blocks, micro blocks, transactions, AENS pointers and contract bytecode using the fetch-based v3 node client.
- Build and unpack transactions offline, calculate minimum fees, derive addresses, sign and verify messages, wrap transactions, and hash wire bytes in Rust.
- Connect through MetaMask Snap, use a caller-provided connector, or sign locally with the Rust-backed memory connector. Mock connectors support tests.
- Spend AE, submit signed transactions, wait for inclusion, and use React, Vue, or Solid for the available query and mutation hooks.

```ts
import { loadProtocol } from '@growae/reactive/protocol'

const { tx } = await loadProtocol()
const [tag, version, fields] = tx.unpack(encodedTransaction)
const rebuilt = tx.build(tag, version, fields)
```

The first protocol operation loads the bundled WASM asset. Serve it with the MIME type `application/wasm`. Node ESM loads it from the installed package. Amounts in the protocol interface are decimal strings and signatures use æternity encodings.

## Moving from 0.1

| Previous use | 0.2 migration |
|---|---|
| `Tag.SpendTx` and SDK-style builder options | Pass `'SpendTx'` and typed fields to [buildTransaction](./api/actions/buildTransaction). Supply nonce and TTL explicitly for offline builds. |
| SDK `Node` and SDK account classes | Use `config.getNodeClient()` for the supported v3 endpoints and connector signing methods for wallet operations. `memory().getProvider()` exposes an address. |
| Synchronous `verifyMessage` | Await it. The memory connector uses AE-framed message signatures that the action can verify. |
| Superhero, iframe, WebExtension, Ledger and wallet detection | These integrations remain in 0.1. Keep that line or implement the [connector contract](./api/createConnector). |
| Sophia call/deploy/simulate and typed data, AENS writes, oracles, GA and state channel helpers | Higher-level actions and framework wrappers are deferred. Use 0.1 for those APIs. The Rust wire builder accepts explicit fields, including already-encoded contract calldata. |
| CLI-generated contract code | The CLI remains separately versioned. Bind generated ACI data to a compatible contract client until higher-level Sophia calls return. |

The current JS contract is the package’s export map. Python and Dart offer low-level transaction operations from source. Desktop Dart and native Python coverage do not imply Flutter mobile packaging. The full roadmap and the previous source are available in the [repository roadmap](https://github.com/growae/reactive/blob/develop/ROADMAP.md) and the [0.1.0 tag](https://github.com/growae/reactive/tree/v0.1.0).
