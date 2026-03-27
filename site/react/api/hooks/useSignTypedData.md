# useSignTypedData

Hook for signing typed/structured data with the connected account.

## Import

```typescript
import { useSignTypedData } from '@reactive/react'
```

## Usage

```tsx
import { useSignTypedData } from '@reactive/react'

function SignTyped() {
  const { mutate: sign, data } = useSignTypedData()

  return (
    <button
      onClick={() =>
        sign({
          domain: { name: 'MyApp', version: '1' },
          data: { action: 'transfer', amount: 100n },
        })
      }
    >
      Sign Typed Data
    </button>
  )
}
```

## Return Type

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for full return type.

### data

```typescript
type SignTypedDataReturnType = {
  signature: string
  address: string
}
```

## Parameters

### domain

- **Type:** `Record<string, unknown>`
- **Required**

The signing domain (app name, version, etc.).

### data

- **Type:** `Record<string, unknown>`
- **Required**

The structured data to sign.

### mutation

See [TanStack Query mutation docs](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) for mutation options.
