# compileContract

Compiles Sophia smart contract source code.

## Import

```typescript
import { compileContract } from '@growae/reactive/actions'
```

## Usage

```typescript
import { compileContract } from '@growae/reactive/actions'

const result = await compileContract(config, {
  sourceCode: `contract MyToken =\n  entrypoint name() = "MyToken"`,
  onCompiler: compiler,
})
```

## Return Type

```typescript
type CompileContractReturnType = {
  bytecode: string
  aci: unknown
}
```

### bytecode

- **Type:** `string`

The compiled contract bytecode.

### aci

- **Type:** `unknown`

The contract's ACI (Aeternity Contract Interface).

## Parameters

### sourceCode

- **Type:** `string`
- **Required**

Sophia source code to compile.

### fileSystem

- **Type:** `Record<string, string>`
- **Optional**

Map of included file paths to their contents, for contracts that use `include`.

### onCompiler

- **Type:** `CompilerBase`
- **Required**

Compiler instance to use for compilation.

## Error Types

```typescript
import type { CompileContractErrorType } from '@growae/reactive'
```

- `CompilationError` — Sophia source code has errors
- `CompilerNotAvailableError` — compiler instance is not reachable
