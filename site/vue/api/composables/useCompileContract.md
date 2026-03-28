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

## Action

- [`compileContract`](/core/api/actions/compileContract)
