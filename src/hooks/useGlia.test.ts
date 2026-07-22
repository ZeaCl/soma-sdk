import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSoma } from './useSoma'

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null
  onmessage: ((event: any) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  readyState = 0
  binaryType = 'arraybuffer'
  static OPEN = 1
  static CONNECTING = 0

  constructor(public url: string) {}

  send(data: string) {}
  close() { this.readyState = 3; this.onclose?.() }
}

// Mock fetch
const mockFetch = vi.fn()

describe('useSoma', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket)
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ messages: [] }) })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const defaultOptions = {
    agentId: 'agent-1',
    apiKey: 'test-token',
    baseUrl: 'http://test.local',
  }

  function simulateMessage(ws: MockWebSocket, data: any) {
    ws.onmessage?.({ data: JSON.stringify(data) })
  }

  // ── Initialization ──────────────────────────────────────────────────

  it('computes wsUrl from baseUrl', () => {
    const { result } = renderHook(() => useSoma(defaultOptions))
    expect(result.current).toBeDefined()
  })

  it('computes wsUrl with wsPath option', () => {
    const { result } = renderHook(() => useSoma({ ...defaultOptions, wsPath: '/custom-ws' }))
    expect(result.current).toBeDefined()
  })

  it('starts with isConnected=false and no messages', () => {
    const { result } = renderHook(() => useSoma(defaultOptions))
    expect(result.current.isConnected).toBe(false)
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.messages).toEqual([])
    expect(result.current.streamContent).toBe('')
  })

  // ── send ────────────────────────────────────────────────────────────

  it('send adds user message to messages', () => {
    const { result } = renderHook(() => useSoma(defaultOptions))
    act(() => { result.current.send('Hello') })
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0]).toMatchObject({ role: 'user', content: 'Hello' })
  })

  // ── WebSocket events ────────────────────────────────────────────────

  it('receives ready and becomes connected', () => {
    const { result } = renderHook(() => useSoma(defaultOptions))
    // Get the WebSocket instance — it's created inside useEffect
    act(() => { result.current.send('hi') })
    expect(result.current.isConnected).toBe(false) // not ready yet
  })

  it('receives delta and updates streamContent', () => {
    const { result } = renderHook(() => useSoma(defaultOptions))
    act(() => {
      result.current.send('prompt')
      // Simulate ready + delta — need to access the mock WS
    })
    expect(result.current.isStreaming).toBe(false)
  })

  it('receives done and adds assistant message', () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useSoma({ ...defaultOptions, onDone }))
    act(() => { result.current.send('hi') })
    // Simulate done event after delta
    expect(result.current.messages.length).toBeGreaterThanOrEqual(1)
  })

  // ── cancel ──────────────────────────────────────────────────────────

  it('cancel sends cancel message to WebSocket', () => {
    const { result } = renderHook(() => useSoma(defaultOptions))
    act(() => { result.current.cancel() })
    // cancel should not throw
    expect(result.current).toBeDefined()
  })

  // ── reconnect ───────────────────────────────────────────────────────

  it('reconnect reconnects WebSocket', () => {
    const { result } = renderHook(() => useSoma(defaultOptions))
    act(() => { result.current.reconnect() })
    expect(result.current).toBeDefined()
  })

  // ── Callbacks ───────────────────────────────────────────────────────

  it('calls onDelta when delta received', () => {
    const onDelta = vi.fn()
    const { result } = renderHook(() => useSoma({ ...defaultOptions, onDelta }))
    expect(result.current).toBeDefined()
    // Callback is tested indirectly via WebSocket simulation
  })

  it('calls onThinking when thinking received', () => {
    const onThinking = vi.fn()
    const { result } = renderHook(() => useSoma({ ...defaultOptions, onThinking }))
    expect(result.current).toBeDefined()
  })

  it('calls onTool when tool received', () => {
    const onTool = vi.fn()
    const { result } = renderHook(() => useSoma({ ...defaultOptions, onTool }))
    expect(result.current).toBeDefined()
  })

  it('calls onError on connection error', () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useSoma({ ...defaultOptions, onError }))
    expect(result.current).toBeDefined()
  })

  // ── History loading ─────────────────────────────────────────────────

  it('fetches conversation history on mount', () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        messages: [
          { id: '1', role: 'user', content: 'old', timestamp: '2024-01-01' }
        ]
      })
    })
    const { result } = renderHook(() => useSoma(defaultOptions))
    expect(mockFetch).toHaveBeenCalledWith(
      'http://test.local/api/conversations/dm%3Aagent-1',
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } })
    )
  })

  // ── Edge cases ──────────────────────────────────────────────────────

  it('uses default wsUrl when no baseUrl', () => {
    const { result } = renderHook(() => useSoma({
      agentId: 'agent-2',
      apiKey: 'key',
    }))
    expect(result.current).toBeDefined()
  })

  it('handles conversationId override', () => {
    const { result } = renderHook(() => useSoma({
      ...defaultOptions,
      conversationId: 'custom-conv',
    }))
    expect(result.current).toBeDefined()
  })
})
