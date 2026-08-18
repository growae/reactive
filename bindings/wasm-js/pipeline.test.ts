import { describe, expect, it } from 'vitest'

// Exercises the committed jco-transpiled output, not a fresh Rust build —
// CI has no Rust toolchain (see .github/workflows/ci.yml). Regenerate
// `generated/` via `pnpm build` here whenever wit/ or placeholder-core/
// change, and commit the result.
describe('wasm32-unknown-unknown + jco pipeline', () => {
  it('loads the transpiled component and calls its export', async () => {
    const mod = await import('./generated/core-harness.js')

    expect(mod.ping()).toBe('pong')
  })
})
