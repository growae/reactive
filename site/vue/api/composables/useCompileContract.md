# useCompileContract

Composable for compiling Sophia smart contract source code.

## Import

```typescript
import { useCompileContract } from '@growae/reactive-vue'
```

## Usage

```vue
<script setup lang="ts">
import { useCompileContract } from '@growae/reactive-vue'

const { mutate: compileContract, isPending, data } = useCompileContract()
</script>

<template>
  <button
    @click="compileContract({ sourceCode, onCompiler: compiler })"
    :disabled="isPending"
  >
    Compile
  </button>
  <p v-if="data">Bytecode: {{ data.bytecode }}</p>
  <p v-if="data">Contract: {{ (data.aci as any)?.contract?.name }}</p>
</template>
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
- Use `data.aci` to read the contract name and function list for UI rendering.
- Use `data.rawAci` as the `aci` parameter when calling `useDeployContract` — it is the full array expected by the SDK.
:::

## Action

- [`compileContract`](/core/api/actions/compileContract)
