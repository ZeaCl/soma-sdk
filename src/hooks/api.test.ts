import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import {
  useSomaConversations,
  useSomaFiles,
  useSomaFileContent,
  useSomaSkills,
  useSomaAgents,
} from './api'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const TOKEN = 'test-token'
const BASE = 'http://test.local'

// ── useSomaConversations ──────────────────────────────────────────────

describe('useSomaConversations', () => {
  it('fetches conversations on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: '1', title: 'Test' }] }),
    })

    const { result } = renderHook(() => useSomaConversations(TOKEN, BASE))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.conversations).toEqual([{ id: '1', title: 'Test' }])
    expect(mockFetch).toHaveBeenCalledWith(
      'http://test.local/api/v1/conversations',
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' } })
    )
  })

  it('handles fetch error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSomaConversations(TOKEN, BASE))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.conversations).toEqual([])
  })

  it('refresh re-fetches', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })

    const { result } = renderHook(() => useSomaConversations(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: '2', title: 'New' }] }),
    })

    await act(async () => { await result.current.refresh() })
    expect(result.current.conversations).toEqual([{ id: '2', title: 'New' }])
  })
})

// ── useSomaFiles ──────────────────────────────────────────────────────

describe('useSomaFiles', () => {
  it('fetches files on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ files: [{ name: 'readme.md', type: 'file' }] }),
    })
    const { result } = renderHook(() => useSomaFiles(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.files).toEqual([{ name: 'readme.md', type: 'file' }])
  })

  it('upload sends POST', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: [] }) })
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: [] }) })

    const { result } = renderHook(() => useSomaFiles(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const ok = await result.current.upload('test.txt', 'base64data', 'docs')
    expect(ok).toBe(true)
  })

  it('mkdir sends POST', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: [] }) })
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: [] }) })

    const { result } = renderHook(() => useSomaFiles(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.mkdir('newdir')
    expect(mockFetch).toHaveBeenCalled()
  })

  it('remove sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: [] }) })
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: [] }) })

    const { result } = renderHook(() => useSomaFiles(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.remove('old.txt')
    expect(mockFetch).toHaveBeenCalled()
  })
})

// ── useSomaFileContent ────────────────────────────────────────────────

describe('useSomaFileContent', () => {
  it('readFile fetches content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('# Hello'),
    })

    const { result } = renderHook(() => useSomaFileContent(TOKEN, BASE))
    const text = await result.current.readFile('readme.md')
    expect(text).toBe('# Hello')
    await waitFor(() => expect(result.current.content).toBe('# Hello'))
  })

  it('readFile sets error on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve(''),
    })

    const { result } = renderHook(() => useSomaFileContent(TOKEN, BASE))
    const text = await result.current.readFile('missing.md')
    expect(text).toBeNull()
    await waitFor(() => expect(result.current.error).toBe('HTTP 404'))
  })

  it('clear resets state', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('data') })
    const { result } = renderHook(() => useSomaFileContent(TOKEN, BASE))
    await result.current.readFile('f.txt')

    act(() => { result.current.clear() })
    expect(result.current.content).toBeNull()
    expect(result.current.error).toBeNull()
  })
})

// ── useSomaSkills ─────────────────────────────────────────────────────

describe('useSomaSkills', () => {
  it('fetches skills on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ name: 'xlsx', description: 'Spreadsheet skill' }] }),
    })
    const { result } = renderHook(() => useSomaSkills(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.skills).toHaveLength(1)
  })

  it('create sends POST and refreshes', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })

    const { result } = renderHook(() => useSomaSkills(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const ok = await result.current.create('my-skill', '# Skill')
    expect(ok).toBe(true)
  })

  it('deleteSkill sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })

    const { result } = renderHook(() => useSomaSkills(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.deleteSkill('old-skill')
    expect(mockFetch).toHaveBeenCalled()
  })

  it('assignToAgents sends PUT', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    const { result } = renderHook(() => useSomaSkills(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const ok = await result.current.assignToAgents('xlsx', ['agent-1', 'agent-2'])
    expect(ok).toBe(true)
  })

  it('getAgentSkills returns skill names', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ name: 'xlsx' }, { name: 'venture' }] })
    })

    const { result } = renderHook(() => useSomaSkills(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const names = await result.current.getAgentSkills('agent-1')
    expect(names).toEqual(['xlsx', 'venture'])
  })

  it('getContent returns skill content', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { name: 'xlsx', content: '# Skill' } })
    })

    const { result } = renderHook(() => useSomaSkills(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const content = await result.current.getContent('xlsx')
    expect(content).toBe('# Skill')
  })
})

// ── useSomaAgents ─────────────────────────────────────────────────────

describe('useSomaAgents', () => {
  it('fetches agents on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: 'a1', name: 'Bot' }] }),
    })
    const { result } = renderHook(() => useSomaAgents(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.agents).toEqual([{ id: 'a1', name: 'Bot' }])
  })

  it('createAgent sends POST and updates state', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'new', name: 'NewBot' } })
    })

    const { result } = renderHook(() => useSomaAgents(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const agent = await result.current.createAgent({ name: 'NewBot', email: 'b@t.com', password: 'pw' })
    expect(agent).toEqual({ id: 'new', name: 'NewBot' })
    await waitFor(() => expect(result.current.agents).toHaveLength(1))
  })

  it('createAgent throws on error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ error: 'Validation failed' })
    })

    const { result } = renderHook(() => useSomaAgents(TOKEN, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      result.current.createAgent({ name: 'Bad', email: 'x', password: 'x' })
    ).rejects.toThrow('Validation failed')
  })
})
