# useCompileContract

Hook for compiling Sophia smart contract source code.

## Import

```typescript
import { useCompileContract } from '@growae/reactive-react'
```

## Usage

```tsx
import { useCompileContract } from '@growae/reactive-react'

function CompileForm() {
  const { mutate: compileContract, isPending, data } = useCompileContract()

  return (
    <div>
      <button
        onClick={() =>
          compileContract({ sourceCode, onCompiler: compiler })
        }
        disabled={isPending}
      >
        Compile
      </button>
      {data && <p>Bytecode: {data.bytecode}</p>}
    </div>
  )
}
```

## Return Type

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for full return type.

### data

See [`compileContract` Return Type](/core/api/actions/compileContract#return-type).

## Parameters

See [`compileContract` Parameters](/core/api/actions/compileContract#parameters) for all available options.

Key parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sourceCode` | `string` | — | Required. Sophia source code to compile. |
| `fileSystem` | `Record<string, string>` | — | Optional. Map of included file paths to their contents. |
| `onCompiler` | `CompilerBase` | — | Required. Compiler instance to use. |

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.

## Action

- [`compileContract`](/core/api/actions/compileContract)
