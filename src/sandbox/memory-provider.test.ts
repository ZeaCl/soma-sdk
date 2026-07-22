import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMemorySandboxProvider } from './memory-provider'

describe('MemorySandboxProvider', () => {
  let sandbox: ReturnType<typeof createMemorySandboxProvider>

  beforeEach(() => {
    sandbox = createMemorySandboxProvider()
  })

  it('writeFile and readFile are consistent', async () => {
    await sandbox.writeFile('/test.txt', 'Hello World')
    const content = await sandbox.readFile('/test.txt')
    expect(content).toBe('Hello World')
  })

  it('listFiles returns written files', async () => {
    await sandbox.writeFile('/a.txt', 'a')
    await sandbox.writeFile('/b.txt', 'b')
    const files = await sandbox.listFiles('/')
    expect(files).toHaveLength(2)
    expect(files[0].name).toBe('a.txt')
    expect(files[1].name).toBe('b.txt')
  })

  it('listFiles with subpath filters correctly', async () => {
    await sandbox.writeFile('/docs/readme.md', 'docs')
    await sandbox.writeFile('/src/index.ts', 'src')
    const docs = await sandbox.listFiles('/docs')
    expect(docs).toHaveLength(1)
    expect(docs[0].name).toBe('readme.md')
  })

  it('deleteFile removes file', async () => {
    await sandbox.writeFile('/temp.txt', 'tmp')
    await sandbox.deleteFile('/temp.txt')
    const files = await sandbox.listFiles('/')
    expect(files).toHaveLength(0)
  })

  it('mkdir creates directory visible in listFiles', async () => {
    await sandbox.mkdir('/newdir')
    await sandbox.writeFile('/newdir/file.txt', 'content')
    const files = await sandbox.listFiles('/')
    expect(files).toHaveLength(1)
    expect(files[0].type).toBe('dir')
  })

  it('handles multiple operations', async () => {
    await sandbox.writeFile('/one.txt', '1')
    await sandbox.writeFile('/two.txt', '2')
    expect(await sandbox.listFiles('/')).toHaveLength(2)
    await sandbox.deleteFile('/one.txt')
    expect(await sandbox.listFiles('/')).toHaveLength(1)
    await sandbox.writeFile('/three.txt', '3')
    expect(await sandbox.listFiles('/')).toHaveLength(2)
  })
})
