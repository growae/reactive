# Sophia contract calls

The JavaScript toolkit encodes function arguments through the Rust `ae-fate` crate. Reads use the node’s protected `POST /v3/dry-run` endpoint. Writes and deployments use the configured wallet to sign transactions built by Rust. Configure a node with dry-run enabled for reads, estimates and simulations.

## Arguments and results

Supply an entry point name and its arguments in declaration order. A JavaScript string encodes a Sophia string. Wrap an address as `{ address }` so it becomes a FATE address. Use a `bigint` for an integer beyond JavaScript’s safe range. The other supported forms include `{ bytes }` for sized bytes, `{ stringBytes }` for unsized bytes, `{ tuple }`, `{ list }`, `{ map: [[key, value]] }`, `{ bits }`, and `{ variant: { arities, index, values } }`. A Sophia record is a tuple in declaration order. Rust orders map keys for the wire.

```ts
import { contractCalldata, decodeContractValue, readContract } from '@growae/reactive/actions'

const callData = await contractCalldata({
  function: 'balance',
  args: [{ address: owner }],
})
const raw = await readContract(config, { address: token, callData })
const value = await decodeContractValue(raw)
```

You can pass `function` and `args` directly to a contract action or provide an already encoded `cb_` value. These APIs use explicit wire types. To infer argument types from ACI or compile Sophia source, use a compatible compiler or code generator. The `decodeContractValue` helper preserves compound values and returns arbitrary-precision integers as `bigint`. A raw FATE value that has no convenience representation is returned as `{ encoded }`.

## Signing and confirmation

Provide `gasLimit` in gas units. `amount` and `fee` are aettos. Unless overridden, the action asks the node for the account’s next nonce and recent gas price, builds and prices the transaction with Rust, and asks the selected wallet to sign for that account and network.

```ts
import { callContract } from '@growae/reactive/actions'

const result = await callContract(config, {
  address: contract,
  function: 'set',
  args: [19n],
  gasLimit: 50_000,
  waitMined: true,
  timeout: 60_000,
})
```

The default resolves when the node accepts the transaction. With `waitMined: true`, the action waits for inclusion and checks the contract’s execution result. A `ContractConfirmationError` carries the submitted hash so a caller can inspect it after a timeout or a revert. [React write hook](/react/api/hooks/useWriteContract) · [Transaction receipt](/react/api/hooks/useTransactionReceipt)

## Indexed events

Use a configured `middlewareUrl` to query historical contract logs or watch for newly indexed events. Pagination cursors belong to the original filters and network. Middleware height can trail the node height. [Contract events](/react/api/hooks/useContractEvents) · [Event watcher](/react/api/hooks/useWatchContractEvent)
