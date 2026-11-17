# Contract hook factories

Import the four factories from `@growae/reactive-react/codegen` to bind a contract address and entry point or event when defining reusable React hooks. Declare the factories at module scope. The resulting functions are hooks and must be called inside a component or another hook.

```tsx
import {
  createUseReadContract,
  createUseSimulateContract,
  createUseWriteContract,
  createUseWatchContractEvent,
} from '@growae/reactive-react/codegen'

export function tokenHooks(networkId: string, address: string) {
  const contract = { networkId, address }
  return {
    useMetadata: createUseReadContract({ ...contract, function: 'meta_info' }),
    useTransferSimulation: createUseSimulateContract({ ...contract, function: 'transfer' }),
    useTransfer: createUseWriteContract({ ...contract, function: 'transfer' }),
    useTransfers: createUseWatchContractEvent({ ...contract, event: 'Transfer' }),
  }
}
```

Pass explicit FATE arguments to a bound read, simulation, or write. The bound write exposes `writeContract` and `writeContractAsync`. Supply the gas limit when submitting a mutation. Bound event hooks take `onLogs` and the usual watch options. Bind a `networkId` to keep calls on the contract’s deployment network, or leave it open to select the network when using the hook. An application can follow this pattern for any Sophia entrypoint or event in its own ACI. [Sophia contract arguments](/core/sophia-contracts)
