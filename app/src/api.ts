// Backend client. The backend runs on the dev machine (:3000) while the app
// runs in the simulator; on real glasses the same backend is deployed to a
// server and BASE is changed here (see README "Point at your backend").
const BASE = 'http://localhost:3000'

async function call(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${BASE}${path}`, { ...init, signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json()
}

export interface Brief {
  next: { title: string; when: string | null } | null
  nextSource: string
  openCount: number
  mail: { connected: boolean; unread: number; top: { from: string; subject: string; snippet: string } | null }
  marketLine: string
  newsTop: string | null
  news: { title: string; url: string }[]
}

export interface Task {
  id: string
  text: string
  done: boolean
}

export const api = {
  brief: (): Promise<Brief> => call('/api/brief'),
  tasks: (): Promise<{ tasks: Task[] }> => call('/api/tasks'),
  toggleTask: (id: string): Promise<{ task: Task }> =>
    call(`/api/tasks/${id}/done`, { method: 'POST' }),
  ask: (q: string): Promise<{ answer: string }> =>
    call('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q }) }),
  draft: (context: string): Promise<{ draft: string }> =>
    call('/api/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context }) }),
  send: (text: string, to: string): Promise<any> =>
    call('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, to, channel: 'draft' }) }),
}
