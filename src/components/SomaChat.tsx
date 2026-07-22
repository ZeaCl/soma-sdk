'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSoma } from '../hooks/useSoma'

// ── Types ──

export interface SomaChatProps {
  agentId: string
  conversationId?: string
  apiKey?: string
  baseUrl?: string
  placeholder?: string
  welcomeMessage?: string
  /** CSS class applied to root element */
  className?: string
  /** Quick color overrides — for full control use CSS variables on parent */
  colors?: Partial<SomaChatColors>
  /** Custom render functions for specific parts */
  renderMessage?: (msg: SomaChatMessage, defaultRender: React.ReactNode) => React.ReactNode
  renderInput?: (defaultRender: React.ReactNode) => React.ReactNode
}

export interface SomaChatColors {
  bg: string
  text: string
  textMuted: string
  userBubble: string
  userBubbleText: string
  agentBubble: string
  agentBubbleText: string
  thinkingBg: string
  thinkingText: string
  thinkingBorder: string
  toolBg: string
  toolText: string
  toolBorder: string
  resultBg: string
  resultText: string
  resultBorder: string
  inputBg: string
  inputBorder: string
  primary: string
  primaryText: string
  font: string
  radius: string
}

export interface SomaChatMessage {
  id: string; role: 'user' | 'assistant' | 'system'; content: string; thinking?: string; timestamp: Date
}

// ── Default colors (ZEA design tokens) ──

const defaultColors: SomaChatColors = {
  bg: 'var(--soma-bg, transparent)',
  text: 'var(--soma-text, var(--zea-bc, #e6edf3))',
  textMuted: 'var(--soma-text-muted, color-mix(in oklch, var(--zea-bc, #e6edf3) 50%, transparent))',
  userBubble: 'var(--soma-user-bubble, var(--zea-p, #16a34a))',
  userBubbleText: 'var(--soma-user-text, var(--zea-pc, #fff))',
  agentBubble: 'var(--soma-agent-bubble, var(--zea-b1, #2a3040))',
  agentBubbleText: 'var(--soma-agent-text, var(--zea-bc, #e6edf3))',
  thinkingBg: 'var(--soma-thinking-bg, color-mix(in oklch, #7c3aed 8%, transparent))',
  thinkingText: 'var(--soma-thinking-text, oklch(70% 0.2 292))',
  thinkingBorder: 'var(--soma-thinking-border, color-mix(in oklch, #7c3aed 20%, transparent))',
  toolBg: 'var(--soma-tool-bg, color-mix(in oklch, #7c3aed 10%, transparent))',
  toolText: 'var(--soma-tool-text, oklch(65% 0.2 292))',
  toolBorder: 'var(--soma-tool-border, color-mix(in oklch, #7c3aed 20%, transparent))',
  resultBg: 'var(--soma-result-bg, color-mix(in oklch, var(--zea-su, #10b981) 10%, transparent))',
  resultText: 'var(--soma-result-text, oklch(60% 0.14 180))',
  resultBorder: 'var(--soma-result-border, color-mix(in oklch, var(--zea-su, #10b981) 25%, transparent))',
  inputBg: 'var(--soma-input-bg, var(--zea-b2, #1e2432))',
  inputBorder: 'var(--soma-input-border, var(--zea-b2, #1e2432))',
  primary: 'var(--soma-primary, var(--zea-p, #16a34a))',
  primaryText: 'var(--soma-primary-text, var(--zea-pc, #fff))',
  font: 'var(--soma-font, var(--zea-sans, system-ui, sans-serif))',
  radius: 'var(--soma-radius, 12px)',
}

// ── Streaming blocks ──

type StreamBlock =
  | { type: 'thinking_start' }
  | { type: 'thinking_delta'; text: string }
  | { type: 'thinking_end' }
  | { type: 'text_delta'; text: string }
  | { type: 'tool_call'; name: string; input: unknown }
  | { type: 'tool_result'; content: string }

function pushBlock(blocks: StreamBlock[], b: StreamBlock): StreamBlock[] {
  const last = blocks[blocks.length - 1]
  if (b.type === 'thinking_delta' && last?.type === 'thinking_delta')
    return [...blocks.slice(0, -1), { type: 'thinking_delta', text: last.text + b.text }]
  if (b.type === 'text_delta' && last?.type === 'text_delta')
    return [...blocks.slice(0, -1), { type: 'text_delta', text: last.text + b.text }]
  return [...blocks, b]
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="soma-code">$1</code>')
    .replace(/\n/g, '<br/>')
}

// ── Component ──

export function SomaChat({
  agentId, conversationId, apiKey, baseUrl,
  placeholder = 'Mensaje para el agente...',
  welcomeMessage = '¡Hola! Soy tu agente. ¿En qué puedo ayudarte?',
  className = '', colors: colorsOverride, renderMessage, renderInput,
}: SomaChatProps) {
  const c = { ...defaultColors, ...colorsOverride }
  const css = (o: Record<string, string|number>) => o as React.CSSProperties

  const [streamBlocks, setStreamBlocks] = useState<StreamBlock[]>([])
  const [thinkingOpen, setThinkingOpen] = useState(true)
  const streamRef = useRef<StreamBlock[]>([])

  const { send, cancel, isStreaming, messages } = useSoma({
    agentId, conversationId, apiKey, baseUrl,
    onDelta: useCallback((text: string) => {
      streamRef.current = pushBlock(streamRef.current, { type: 'text_delta', text })
      setStreamBlocks([...streamRef.current])
    }, []),
    onThinking: useCallback((text: string) => {
      streamRef.current = pushBlock(streamRef.current, { type: 'thinking_delta', text })
      setStreamBlocks([...streamRef.current])
    }, []),
    onTool: useCallback((name: string, input: unknown) => {
      streamRef.current = pushBlock(streamRef.current, { type: 'tool_call', name, input })
      setStreamBlocks([...streamRef.current])
    }, []),
    onDone: useCallback(() => { streamRef.current = []; setStreamBlocks([]) }, []),
    onCancelled: useCallback(() => { streamRef.current = []; setStreamBlocks([]) }, []),
  })

  const [input, setInput] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamBlocks])
  useEffect(() => { if (!isStreaming) setCancelling(false) }, [isStreaming])

  const handleSend = () => { const t = input.trim(); if (t && !isStreaming) { send(t); setInput('') } }
  const handleCancel = () => { setCancelling(true); cancel() }

  // Per-message thinking open state (Record avoids TSX generic ambiguity)
  const [thinkingOpenIds, setThinkingOpenIds] = useState<Record<string, boolean>>({})
  const toggleMsgThinking = useCallback((id: string) => {
    setThinkingOpenIds(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  // ── Message bubble ──
  const defaultMessage = (msg: SomaChatMessage) => {
    const thinkingOpen = !!thinkingOpenIds[msg.id]
    return (
    <div key={msg.id} className="soma-msg" style={css({ display:'flex', flexDirection:'column', alignItems: msg.role==='user'?'flex-end':'flex-start', gap:4 })}>
      {/* Thinking block (persisted) */}
      {msg.thinking && (
        <div className="soma-thinking-persisted" style={css({ maxWidth:'85%', borderRadius: c.radius, overflow:'hidden' })}>
          <button onClick={() => toggleMsgThinking(msg.id)} style={css({
            display:'flex', alignItems:'center', gap:6, width:'100%', padding:'4px 10px',
            border:'none', cursor:'pointer', background:c.thinkingBg, color:c.thinkingText,
            fontSize:10, fontFamily:c.font, fontWeight:600, borderRadius: thinkingOpen ? `${c.radius} ${c.radius} 0 0` : c.radius,
          })}>
            <span style={css({ fontSize:10 })}>{thinkingOpen ? '▼' : '▶'}</span>
            <span style={css({ padding:'0px 5px', borderRadius:3, background:c.thinkingBorder, fontSize:9 })}>thinking</span>
          </button>
          {thinkingOpen && (
            <div style={css({
              padding:'6px 10px', background:c.thinkingBg, borderLeft:`2px solid ${c.thinkingBorder}`,
              fontSize:11, lineHeight:1.5, color:c.thinkingText, whiteSpace:'pre-wrap', fontStyle:'italic',
            })}>{msg.thinking}</div>
          )}
        </div>
      )}
      {/* Text bubble */}
      <div className="soma-bubble" style={css({
        maxWidth:'85%', padding:'10px 14px', borderRadius: c.radius, fontSize:13, lineHeight:1.55,
        background: msg.role==='user' ? c.userBubble : c.agentBubble,
        color: msg.role==='user' ? c.userBubbleText : c.agentBubbleText,
        borderBottomRightRadius: msg.role==='user' ? '4px' : c.radius,
        borderBottomLeftRadius: msg.role!=='user' ? '4px' : c.radius,
      })}>
        <div className="soma-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
      </div>
    </div>
  )}

  // ── Input area ──
  const defaultInput = (
    <div className="soma-input-area" style={css({ padding:'12px 16px', borderTop:`1px solid ${c.inputBorder}`, flexShrink:0 })}>
      <div className="soma-input-row" style={css({
        display:'flex', alignItems:'flex-end', gap:8, background:c.inputBg,
        border:`1px solid ${c.inputBorder}`, borderRadius:c.radius, padding:'8px 12px',
      })}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={isStreaming ? 'El agente está respondiendo...' : placeholder}
          rows={2} disabled={isStreaming}
          className="soma-textarea" style={css({
            flex:1, resize:'none', border:'none', outline:'none', background:'transparent',
            color:c.text, fontSize:13, fontFamily:c.font, opacity: isStreaming ? 0.5 : 1,
          })} />
        {isStreaming ? (
          <button onClick={handleCancel} disabled={cancelling} className="soma-btn-cancel" style={css({
            width:32, height:32, borderRadius:'50%', border:'none',
            background: cancelling ? c.inputBorder : c.primary,
            color: cancelling ? c.textMuted : c.primaryText, cursor: cancelling?'default':'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0,
          })}>{cancelling ? '⏳' : '■'}</button>
        ) : (
          <button onClick={handleSend} className="soma-btn-send" style={css({
            width:32, height:32, borderRadius:'50%', border:'none',
            background: input.trim() ? c.primary : c.inputBorder, color: c.primaryText,
            cursor: input.trim()?'pointer':'default', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:16, flexShrink:0, opacity: input.trim()?1:0.4,
          })}>↑</button>
        )}
      </div>
    </div>
  )

  return (
    <div className={`soma-root ${className}`} style={css({ display:'flex', flexDirection:'column', height:'100%', background:c.bg, fontFamily:c.font })}>
      {/* Messages feed */}
      <div ref={feedRef} className="soma-feed" style={css({ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 })}>
        {messages.length === 0 && !isStreaming && (
          <p className="soma-welcome" style={css({ textAlign:'center', fontSize:13, color:c.textMuted, marginTop:'40%' })}>{welcomeMessage}</p>
        )}
        {messages.map(msg => renderMessage ? renderMessage(msg, defaultMessage(msg)) : defaultMessage(msg))}
        {streamBlocks.length > 0 && (
          <StreamingView blocks={streamBlocks} colors={c} thinkingOpen={thinkingOpen} onToggleThinking={() => setThinkingOpen(o => !o)} />
        )}
        {isStreaming && streamBlocks.length === 0 && (
          <div className="soma-thinking-indicator" style={css({ display:'flex', alignItems:'center', gap:8, padding:'8px 0' })}>
            <div style={css({ width:6, height:6, borderRadius:'50%', background:c.thinkingText, animation:'soma-pulse 1.2s ease-in-out infinite' })} />
            <span style={css({ fontSize:12, color:c.textMuted })}>Pensando...</span>
          </div>
        )}
      </div>

      {/* Input */}
      {renderInput ? renderInput(defaultInput) : defaultInput}

      <style>{'@keyframes soma-pulse{0%,100%{opacity:1}50%{opacity:0.3}}.soma-code{background:var(--soma-code-bg,var(--zea-b2,#1e2432));padding:1px 5px;border-radius:4px;font-size:0.9em}'}</style>
    </div>
  )
}

// ── Streaming View ──

function StreamingView({ blocks, colors: c, thinkingOpen, onToggleThinking }: {
  blocks: StreamBlock[]; colors: SomaChatColors; thinkingOpen: boolean; onToggleThinking: () => void
}) {
  const css = (o: Record<string, string|number>) => o as React.CSSProperties
  const hasThinking = blocks.some(b => b.type.startsWith('thinking'))
  const textBlocks = blocks.filter(b => b.type === 'text_delta')
  const lastText = textBlocks[textBlocks.length - 1]?.text || ''

  return (
    <div className="soma-stream" style={css({ display:'flex', flexDirection:'column', gap:8 })}>
      {hasThinking && (
        <div className="soma-thinking" style={css({ borderRadius: c.radius, overflow:'hidden' })}>
          <button onClick={onToggleThinking} className="soma-thinking-toggle" style={css({
            display:'flex', alignItems:'center', gap:6, width:'100%', padding:'6px 12px',
            border:'none', cursor:'pointer', background:c.thinkingBg, color:c.thinkingText,
            fontSize:11, fontFamily:c.font, fontWeight:600,
          })}>
            <span>{thinkingOpen ? '▼' : '▶'}</span>
            <span style={css({ padding:'1px 6px', borderRadius:4, background:c.thinkingBorder, fontSize:10 })}>thinking</span>
          </button>
          {thinkingOpen && (
            <div className="soma-thinking-body" style={css({
              padding:'8px 12px', background:c.thinkingBg, borderLeft:`2px solid ${c.thinkingBorder}`,
              fontSize:12, lineHeight:1.5, color:c.thinkingText, whiteSpace:'pre-wrap', fontStyle:'italic',
            })}>
              {blocks.filter(b => b.type==='thinking_delta').map(b => b.text).join('')}
            </div>
          )}
        </div>
      )}

      {blocks.filter(b => b.type==='tool_call').map((b, i) => (
        <div key={i} className="soma-tool" style={css({
          display:'flex', alignItems:'center', gap:8, padding:'6px 12px', borderRadius:8,
          background:c.toolBg, border:`1px solid ${c.toolBorder}`, fontSize:12, color:c.toolText,
        })}>
          <span style={css({ fontWeight:600 })}>🔧 {b.name}</span>
          <span style={css({ opacity:0.7, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 })}>
            {typeof b.input==='string' ? b.input : JSON.stringify(b.input)}
          </span>
        </div>
      ))}

      {blocks.filter(b => b.type==='tool_result').map((b, i) => (
        <div key={i} className="soma-result" style={css({
          padding:'8px 12px', borderRadius:8, background:c.resultBg, border:`1px solid ${c.resultBorder}`,
          fontSize:11, lineHeight:1.5, maxHeight:150, overflowY:'auto', color:c.resultText,
          whiteSpace:'pre-wrap', fontFamily:'monospace',
        })}>{b.content.slice(0, 2000)}</div>
      ))}

      {lastText && (
        <div className="soma-bubble soma-stream-text" style={css({
          padding:'10px 14px', borderRadius:c.radius, background:c.agentBubble, color:c.agentBubbleText,
          fontSize:13, lineHeight:1.55, maxWidth:'85%', borderBottomLeftRadius:'4px',
        })}>
          <div className="soma-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(lastText) }} />
        </div>
      )}
    </div>
  )
}
