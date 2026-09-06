# deployContract

Deploys a Sophia smart contract to the Aeternity blockchain.

## Import

```typescript
import { deployContract } from '@growae/reactive/actions'
```

## Usage

```typescript
import { compileContract, deployContract } from '@growae/reactive/actions'

// Compile first — use rawAci (the full array) for deployment
const compiled = await compileContract(config, { sourceCode, onCompiler: compiler })

const result = await deployContract(config, {
  aci: compiled.rawAci,   // full ACI array — required by aepp-sdk
  bytecode: compiled.bytecode,
  initArgs: ['initial_value', 42n],
})

console.log('Deployed at:', result.address)
console.log('Tx:', result.txHash)
```

::: tip ACI from compileContract
When deploying a freshly compiled contract, pass `compiled.rawAci` (not `compiled.aci`) as the `aci` parameter. The `rawAci` is the full array expected by the SDK. The `aci` field is the normalized single-contract entry useful for UI rendering (function names, argument types).
:::

## Return Type

```typescript
type DeployContractReturnType = {
  address: string
  txHash: string
  rawTx: string
  result?: unknown
}
```

### address

- **Type:** `string`

The deployed contract address (`ct_...`).

### txHash

- **Type:** `string`

The transaction hash (`th_...`).

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sourceCode` | `string` | — | Sophia source to deploy. Either this or `bytecode` must be present. |
| `bytecode` | `string` | — | Compiled contract bytecode. Either this or `sourceCode` must be present. |
| `aci` | `Aci` | — | Contract ACI. The SDK encodes `initArgs` against it, and the map key-order guard below is a miss without it. |
| `initArgs` | `unknown[]` | `[]` | Arguments for the `init` function. |
| `onCompiler` | `CompilerBase` | — | Compiler instance, for a `sourceCode` deployment. |
| `networkId` | `string` | active | Target network. |
| `options.amount` | `bigint` | `0n` | AE (in aettos) to send to the contract on deploy. |
| `options.gasLimit` | `number` | auto | Gas limit for deployment. |
| `options.gasPrice` | `bigint` | auto | Gas price in aettos. |
| `options.fee` | `bigint` | auto | Transaction fee in aettos. |
| `options.deposit` | `bigint` | auto | Deposit attached to the create transaction. |
| `options.ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |

Every field of `DeployContractParameters` is optional at the type level; what
the action enforces is that one of `sourceCode` and `bytecode` is present, which
is what `DeployContractNoCodeError` reports. There is no top-level `args`,
`gas`, `ttl` or `fee`, and the action exposes no nonce override at all — the
nonce is the SDK's to pick.

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `options: { ttl: 0 }` for no expiration.
:::

## Examples

### Deploy with initial funds

```typescript
const result = await deployContract(config, {
  aci: vaultAci,
  bytecode: vaultBytecode,
  initArgs: [],
  options: { amount: 10000000000000000000n }, // 10 AE
})

console.log('Deployed at:', result.address)
```

## Error Types

```typescript
import type { DeployContractErrorType } from '@growae/reactive'
```

`DeployContractErrorType` names its concrete classes, so `instanceof` narrows
against it. In the order the action can raise them:

- `DeployContractNoCodeError` — neither `sourceCode` nor `bytecode` was passed
- `DeployContractMapKeyOrderError` — a `map` init argument would be serialised in a key order the node's decoder refuses. Checked first, before the node is reached and before anything is built. The guard is a miss rather than a refusal when `aci` is absent, since a source-only deployment has nothing here to read the init argument types off
- `DeployContractNoAccountError` — no connected account
- `NetworkNotConfiguredError` — `networkId` was passed and is not in `createConfig({ networks })`
- `DeployContractInvocationError` — the node executed `init` and refused it; carries `reason`, `transaction` and `transactionHash`

Any other `@aeternity/aepp-sdk` failure — compilation through `onCompiler`,
contract initialisation, node transport — is rethrown unchanged.
