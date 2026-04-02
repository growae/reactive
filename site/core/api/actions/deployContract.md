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
  args: ['initial_value', 42n],
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
| `aci` | `Aci` | — | Required. Contract ACI. |
| `bytecode` | `string` | — | Required. Compiled contract bytecode. |
| `args` | `unknown[]` | `[]` | Arguments for the `init` function. |
| `amount` | `bigint` | `0n` | AE (in aettos) to send to the contract on deploy. |
| `gas` | `number` | auto | Gas limit for deployment. |
| `gasPrice` | `bigint` | auto | Gas price in aettos. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |
| `nonce` | `number` | auto | Account nonce. |
| `fee` | `bigint` | auto | Transaction fee in aettos. |

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Examples

### Deploy with initial funds

```typescript
const result = await deployContract(config, {
  aci: vaultAci,
  bytecode: vaultBytecode,
  args: [],
  amount: 10000000000000000000n, // 10 AE
})

console.log('Deployed at:', result.address)
```

## Error Types

```typescript
import type { DeployContractErrorType } from '@growae/reactive'
```

- `ConnectorNotConnectedError` — no wallet connected
- `ContractDeployError` — deployment failed (init reverted, out of gas, etc.)
- `InsufficientBalanceError` — not enough AE for fee + amount
