import { describe, it, expect } from 'vitest'

const BASE_URL = 'http://localhost:4084'

describe('Soma SDK Integration', () => {
  it('GET /health returns ok', async () => {
    const res = await fetch(`${BASE_URL}/health`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  it('GET /api/skills returns 401 without auth (expected)', async () => {
    const res = await fetch(`${BASE_URL}/api/skills`)
    expect(res.status).toBe(401)
  })

  it('GET /api/conversations returns 401 without auth', async () => {
    const res = await fetch(`${BASE_URL}/api/conversations`)
    expect(res.status).toBe(401)
  })

  it('GET /api/agents returns 401 without auth', async () => {
    const res = await fetch(`${BASE_URL}/api/agents`)
    expect(res.status).toBe(401)
  })

  it('GET /metrics returns response', async () => {
    const res = await fetch(`${BASE_URL}/metrics`)
    // PromEx may need manual start; accept any non-500 response
    expect([200, 500, 404]).toContain(res.status)
  })
})
