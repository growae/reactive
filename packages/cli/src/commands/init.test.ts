import { existsSync } from 'node:fs'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { init } from './init.js'

describe('init', () => {
  let tempDir: string
  let cwdSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    tempDir = join(tmpdir(), `reactive-cli-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir)
  })

  afterEach(async () => {
    cwdSpy.mockRestore()
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should create a default config file', async () => {
    const configPath = await init()

    expect(existsSync(configPath)).toBe(true)
    const content = await readFile(configPath, 'utf-8')
    expect(content).toContain('defineConfig')
    expect(content).toContain("out: 'src/generated.ts'")
    expect(content).toContain('contracts: []')
  })

  it('should create config at custom path', async () => {
    const configPath = await init({ config: 'custom.config.ts' })

    expect(configPath).toContain('custom.config.ts')
    expect(existsSync(configPath)).toBe(true)
  })

  it('should skip if config already exists', async () => {
    const { writeFile } = await import('node:fs/promises')
    const existingPath = join(tempDir, 'reactive.config.ts')
    await writeFile(existingPath, 'existing content')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const configPath = await init()
    consoleSpy.mockRestore()

    expect(configPath).toBe(existingPath)
  })

  it('should create config in custom root directory', async () => {
    const subDir = join(tempDir, 'subdir')
    await mkdir(subDir, { recursive: true })

    const configPath = await init({ root: subDir })

    expect(configPath).toContain('subdir')
    expect(existsSync(configPath)).toBe(true)
  })
})
