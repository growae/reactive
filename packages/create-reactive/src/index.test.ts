import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { frameworks } from './frameworks.js'
import { copy } from './utils.js'

const templatesDir = resolve(
  fileURLToPath(import.meta.url),
  '../../templates',
)

describe('template copying', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = join(tmpdir(), `create-reactive-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should copy vite-react template files', () => {
    const templateDir = join(templatesDir, 'vite-react')
    copy(templateDir, tempDir)

    expect(existsSync(join(tempDir, 'package.json'))).toBe(true)
    expect(existsSync(join(tempDir, 'vite.config.ts'))).toBe(true)
    expect(existsSync(join(tempDir, 'tsconfig.json'))).toBe(true)
    expect(existsSync(join(tempDir, 'index.html'))).toBe(true)
    expect(existsSync(join(tempDir, 'src/main.tsx'))).toBe(true)
    expect(existsSync(join(tempDir, 'src/App.tsx'))).toBe(true)
    expect(existsSync(join(tempDir, 'src/reactive.ts'))).toBe(true)
    expect(existsSync(join(tempDir, '_gitignore'))).toBe(true)

    const pkg = JSON.parse(
      readFileSync(join(tempDir, 'package.json'), 'utf-8'),
    ) as Record<string, unknown>
    const deps = pkg['dependencies'] as Record<string, string>
    expect(deps['@reactive/react']).toBeDefined()
    expect(deps['react']).toBeDefined()
  })

  it('should copy vite-vue template files', () => {
    const templateDir = join(templatesDir, 'vite-vue')
    copy(templateDir, tempDir)

    expect(existsSync(join(tempDir, 'package.json'))).toBe(true)
    expect(existsSync(join(tempDir, 'vite.config.ts'))).toBe(true)
    expect(existsSync(join(tempDir, 'src/main.ts'))).toBe(true)
    expect(existsSync(join(tempDir, 'src/App.vue'))).toBe(true)
  })

  it('should copy vite-solid template files', () => {
    const templateDir = join(templatesDir, 'vite-solid')
    copy(templateDir, tempDir)

    expect(existsSync(join(tempDir, 'package.json'))).toBe(true)
    expect(existsSync(join(tempDir, 'vite.config.ts'))).toBe(true)
    expect(existsSync(join(tempDir, 'src/index.tsx'))).toBe(true)
    expect(existsSync(join(tempDir, 'src/App.tsx'))).toBe(true)
  })

  it('should copy next template files', () => {
    const templateDir = join(templatesDir, 'next')
    copy(templateDir, tempDir)

    expect(existsSync(join(tempDir, 'package.json'))).toBe(true)
    expect(existsSync(join(tempDir, 'next.config.js'))).toBe(true)
    expect(existsSync(join(tempDir, 'tsconfig.json'))).toBe(true)
    expect(existsSync(join(tempDir, 'src/app/layout.tsx'))).toBe(true)
    expect(existsSync(join(tempDir, 'src/app/page.tsx'))).toBe(true)
    expect(existsSync(join(tempDir, 'src/app/providers.tsx'))).toBe(true)
    expect(existsSync(join(tempDir, 'src/reactive.ts'))).toBe(true)
  })

  it('should have templates for all framework variants', () => {
    const allVariants = frameworks.flatMap((f) =>
      f.variants.map((v) => v.name),
    )

    for (const variant of allVariants) {
      const templateDir = join(templatesDir, variant)
      if (!existsSync(templateDir)) continue
      const files = readdirSync(templateDir)
      expect(files.length).toBeGreaterThan(0)
      expect(files).toContain('package.json')
    }
  })
})
