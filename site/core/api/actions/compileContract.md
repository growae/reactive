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
  rawAci: unknown[]
}
```

### bytecode

- **Type:** `string`

The compiled contract bytecode.

### aci

- **Type:** `unknown`

The normalized `contract_main` ACI entry extracted from the compiler response. Use this for UI work — reading the contract name, listing entrypoints, building function forms.

### rawAci

- **Type:** `unknown[]`

The full ACI array as returned by the Sophia compiler (may include the main contract entry plus namespace entries). Pass this to `deployContract` or `Contract.initialize` when the SDK needs the full ACI.

::: tip Which field to use where
- **`aci`** — read `aci.contract.name`, `aci.contract.functions` for UI rendering
- **`rawAci`** — pass as `aci` parameter to `deployContract` or `callContract`
:::

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

`CompileContractErrorType` names its one concrete class:

- `CompileContractNoCompilerError` — `onCompiler` was not passed

Everything else comes from the compiler you pass in, unwrapped: a Sophia syntax
or type error arrives as the compiler's own rejection from
`compileBySourceCode`, not as a Reactive error class. `compileContract` does not
read the config — it resolves no network and needs no connected account — so it
raises no configuration or connection error at all.
