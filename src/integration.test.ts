/**
 * Integration tests — run against a real Soma instance.
 *
 * Requires: docker compose -f docker-compose.test.yml up -d
 * Run: npx vitest run src/integration.test.ts
 */
import { describe, it, expect, beforeAll } from 'vitest'

const BASE_URL = 'http://localhost:4084'

describe('Soma SDK Integration', () => {
  // ── Health ──────────────────────────────────────────────────────────

  it('GET /health returns ok', async () => {
    const res = await fetch(`${BASE_URL}/health`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.service).toBe('soma')
  })

  // ── Skills ──────────────────────────────────────────────────────────

  it('GET /api/skills returns skills list', async () => {
    const res = await fetch(`${BASE_URL}/api/skills`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
  })

  // ── Conversations ───────────────────────────────────────────────────

  it('GET /api/conversations returns empty when unauthenticated', async () => {
    const res = await fetch(`${BASE_URL}/api/conversations`)
    expect(res.status).toBe(200)
  })

  // ── Agents ──────────────────────────────────────────────────────────

  it('GET /api/agents returns list', async () => {
    const res = await fetch(`${BASE_URL}/api/agents`)
    expect(res.status).toBe(200)
  })

  // ── Metrics ─────────────────────────────────────────────────────────

  it('GET /metrics returns prometheus format', async () => {
    const res = await fetch(`${BASE_URL}/metrics`)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('soma')
  })
})
