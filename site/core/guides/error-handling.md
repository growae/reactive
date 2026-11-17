# Error handling

Node requests, wallet interactions, and Rust protocol validation can fail. Catch the specific condition your application can recover from and surface other failures to the caller.

| Error | When |
|---|---|
| `AccountNotConnectedError` | Reserved for an account that is known but not connected |
| `AccountNotFoundError` | `switchActiveAccount` was given an address that is not on the active connection |
| `BaseError` | Base class for configuration and connector errors. |
| `CallsSubmissionError` | A transaction group stopped at `index` (zero-based). Check `group.hashes` on its network before retrying. The last hash may have reached the node even if the response was lost. |
| `CallsWaitError` | The group was submitted, but waiting for inclusion failed. Pass `group` to `getCallsStatus` or `waitForCallsStatus` to resume. |
| `ConnectorAccountUnavailableError` | A transaction was pinned to an account the connector does not hold. `signTransaction` takes an optional `onAccount`, and a connector that cannot serve the named account throws rather than signing with its own — a fallback would return a valid signature from the wrong sender |
| `ConnectorAlreadyConnectedError` | `connect` was called for a connector that already holds a connection |
| `ConnectorNotConnectedError` | A connector method that needs a live provider or account was called while disconnected |
| `ConnectorNotFoundError` | `switchConnection` was given a connector uid that is not in the config |
| `ConnectorUnavailableReconnectingError` | Reserved for connector access during reconnection, when only `id`, `name`, `type` and `uid` are guaranteed |
| `ContractConfirmationError` | A submitted contract transaction reverted, its confirmation timed out, or its execution result could not be established. Inspect `hash` with `getTransactionReceipt` before submitting another transaction. |
| `NetworkNotConfiguredError` | The requested `networkId` is not in `createConfig({ networks })`. Thrown by config's node resolution, by `switchNetwork`, and by the connectors when asked to switch |
| `NodeConnectionError` | Reserved for a failed connection to a node URL; carries the cause |
| `NodeNotFoundError` | Reserved for a network with no node client resolved |
| `NodeRequestError` | A node returned a non-successful HTTP status. Inspect `statusCode`. |
| `ProviderNotFoundError` | The wallet provider is not present — no injected extension, no iframe parent, no Snap |
| `SwitchNetworkNotSupportedError` | Reserved for connectors without programmatic network switching |
