# useSignMessage

Primitive for signing an arbitrary message with the connected account.

## Import

```typescript
import { useSignMessage } from '@reactive/solid'
```

## Usage

```tsx
import { useSignMessage } from '@reactive/solid'

function SignMessage() {
  const signMessage = useSignMessage()

  return (
    <div>
      <button onClick={() => signMessage.mutate({ message: 'Hello, Aeternity!' })}>
        Sign Message
      </button>
      <Show when={signMessage.data}>
        <p>Signature: {signMessage.data?.signature}</p>
      </Show>
    </div>
  )
}
```

## Parameters

See [`signMessage` Parameters](/core/api/actions/signMessage#parameters).

## Action

- [`signMessage`](/core/api/actions/signMessage)
