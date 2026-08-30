import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { frameworks } from './frameworks'
import { createReactive } from './index'
import { copy } from './utils'

const templatesDir = resolve(fileURLToPath(import.meta.url), '../../templates')

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
    const deps = pkg.dependencies as Record<string, string>
    expect(deps['@growae/reactive-react']).toBeDefined()
    expect(deps.react).toBeDefined()
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
    const allVariants = frameworks.flatMap((f) => f.variants.map((v) => v.name))

    for (const variant of allVariants) {
      const templateDir = join(templatesDir, variant)
      expect(existsSync(templateDir)).toBe(true)
      const files = readdirSync(templateDir)
      expect(files.length).toBeGreaterThan(0)
      expect(files).toContain('package.json')
    }
  })
})

describe('scaffold-time npm engine warning', () => {
  let scaffoldTempDir: string
  const originalCwd = process.cwd()
  const originalUserAgent = process.env.npm_config_user_agent

  beforeEach(async () => {
    scaffoldTempDir = join(
      tmpdir(),
      `create-reactive-engine-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    )
    await mkdir(scaffoldTempDir, { recursive: true })
    process.chdir(scaffoldTempDir)
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    if (originalUserAgent === undefined) {
      delete process.env.npm_config_user_agent
    } else {
      process.env.npm_config_user_agent = originalUserAgent
    }
    await rm(scaffoldTempDir, { recursive: true, force: true })
  })

  async function scaffold(template: string, userAgent: string) {
    process.env.npm_config_user_agent = userAgent
    const lines: string[] = []
    const logSpy = vi
      .spyOn(console, 'log')
      .mockImplementation((...args: unknown[]) => {
        lines.push(args.join(' '))
      })
    await createReactive({ targetDir: 'scaffolded-app', template })
    logSpy.mockRestore()
    return lines.join('\n')
  }

  async function scaffoldNuxt(userAgent: string) {
    return scaffold('nuxt', userAgent)
  }

  it('warns and does not suggest npm install when npm is below the template floor', async () => {
    const output = await scaffoldNuxt('npm/10.9.8 node/v20.11.0 linux x64')

    expect(output).toContain('npm >=11')
    expect(output).toContain('10.9.8')
    expect(output).not.toContain('  npm install')
    expect(output).toContain('  pnpm install')
  })

  it('does not warn when npm satisfies the template floor', async () => {
    const output = await scaffoldNuxt('npm/11.19.0 node/v20.11.0 linux x64')

    expect(output).not.toContain('Warning')
    expect(output).toContain('npm install')
  })

  it('does not warn under pnpm, regardless of the npm floor', async () => {
    const output = await scaffoldNuxt('pnpm/9.0.0 node/v20.11.0 linux x64')

    expect(output).not.toContain('Warning')
    expect(output).toContain('pnpm install')
  })

  it('does not warn for a template with no npm floor', async () => {
    const output = await scaffold(
      'vite-vue',
      'npm/10.9.8 node/v20.11.0 linux x64',
    )

    expect(output).not.toContain('Warning')
    expect(output).toContain('npm install')
  })
})
