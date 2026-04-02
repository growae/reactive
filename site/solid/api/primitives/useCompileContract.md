# useCompileContract

Primitive for compiling Sophia smart contract source code.

## Import

```typescript
import { useCompileContract } from '@growae/reactive-solid'
```

## Usage

```tsx
import { useCompileContract } from '@growae/reactive-solid'

function CompileForm() {
  const compileContract = useCompileContract()

  return (
    <div>
      <button
        onClick={() =>
          compileContract.mutate({ sourceCode, onCompiler: compiler })
        }
        disabled={compileContract.isPending}
      >
        Compile
      </button>
      <Show when={compileContract.data}>
        <p>Bytecode: {compileContract.data?.bytecode}</p>
        <p>Contract: {(compileContract.data?.aci as any)?.contract?.name}</p>
      </Show>
    </div>
  )
}
```

## Parameters

See [`compileContract` Parameters](/core/api/actions/compileContract#parameters).

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sourceCode` | `string` | — | Required. Sophia source code to compile. |
| `fileSystem` | `Record<string, string>` | — | Optional. Map of included file paths to their contents. |
| `onCompiler` | `CompilerBase` | — | Required. Compiler instance to use. |

::: tip `aci` vs `rawAci`
- Use `compileContract.data?.aci` to read the contract name and function list for UI rendering.
- Use `compileContract.data?.rawAci` as the `aci` parameter when calling `useDeployContract` — it is the full array expected by the SDK.
:::

## Action

- [`compileContract`](/core/api/actions/compileContract)
