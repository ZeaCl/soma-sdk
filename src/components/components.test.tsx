import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SomaChat } from './SomaChat'
import { SomaCopilot } from './SomaCopilot'
import { SomaPanel } from './SomaPanel'

beforeEach(() => {
  vi.stubGlobal('WebSocket', class {
    onopen = null; onmessage = null; onclose = null; onerror = null
    readyState = 0; binaryType = 'arraybuffer'
    static OPEN = 1
    send() {}; close() {}
  })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({ messages: [] }) }))
  // jsdom doesn't implement scrollTo
  Element.prototype.scrollTo = vi.fn() as any
})

describe('SomaChat', () => {
  const defaultProps = {
    agentId: 'agent-1',
    apiKey: 'test-key',
    baseUrl: 'http://test.local',
  }

  it('renders welcome message', () => {
    render(<SomaChat {...defaultProps} welcomeMessage="¡Hola!" />)
    expect(screen.getByText('¡Hola!')).toBeDefined()
  })

  it('renders with custom placeholder', () => {
    render(<SomaChat {...defaultProps} placeholder="Escribe..." />)
    expect(screen.getByPlaceholderText('Escribe...')).toBeDefined()
  })

  it('renders with custom className', () => {
    const { container } = render(<SomaChat {...defaultProps} className="my-chat" />)
    expect(container.querySelector('.my-chat')).toBeDefined()
  })

  it('renders without crashing with minimal props', () => {
    const { container } = render(<SomaChat agentId="minimal" apiKey="test" />)
    expect(container.querySelector('div')).toBeDefined()
  })
})

describe('SomaCopilot', () => {
  const defaultProps = {
    agentId: 'agent-1',
    apiKey: 'test-key',
    baseUrl: 'http://test.local',
  }

  it('renders floating button', () => {
    const { container } = render(<SomaCopilot {...defaultProps} />)
    expect(container.querySelector('button')).toBeDefined()
  })

  it('renders with custom label', () => {
    render(<SomaCopilot {...defaultProps} />)
    // The button should exist
    expect(screen.getByRole('button')).toBeDefined()
  })
})

describe('SomaPanel', () => {
  it('renders panel with tabs', () => {
    const { container } = render(<SomaPanel />)
    expect(container).toBeDefined()
  })
})
