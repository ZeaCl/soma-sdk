'use client'

import React from 'react'

interface SomaConversationListProps {
  conversations: Array<{ id: string; title: string; lastMessageAt: string; messageCount: number }>
  activeId?: string
  onSelect?: (id: string) => void
  onNew?: (agentId: string) => void
  agents?: Array<{ id: string; name: string }>
}

export function SomaConversationList({ conversations, activeId, onSelect, onNew, agents = [] }: SomaConversationListProps) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {/* New conversation button — always visible when onNew is provided */}
      {onNew && (
        <button
          onClick={() => onNew(agents[0]?.id || '')}
          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          style={{
            color: '#7c3aed',
            border: '1px dashed #7c3aed40',
            background: '#7c3aed0a',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed18' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#7c3aed0a' }}
        >
          <span className="text-lg leading-none">+</span>
          <span>Nueva conversación</span>
        </button>
      )}
      {conversations.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">No conversations yet</p>
      )}
      {conversations.map(conv => (
        <button key={conv.id} onClick={() => onSelect?.(conv.id)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 flex flex-col ${
            activeId === conv.id ? 'bg-blue-50' : ''
          }`}>
          <span className="font-medium truncate">{conv.title || 'Nueva conversación'}</span>
          <span className="text-xs text-gray-400">{conv.messageCount} mensajes</span>
        </button>
      ))}
    </div>
  )
}
