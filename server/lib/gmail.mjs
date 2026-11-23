// Optional Gmail module (env-gated).
// Reads the user's real inbox over IMAP with an app password.
// Setup (user step, 2 minutes, no new account):
//   1. Google Account -> Security -> 2-Step Verification -> App passwords
//   2. Create one named "Briefly", paste the 16-char password into .env
//      as GMAIL_APP_PASSWORD (GMAIL_USER = the Gmail address).
// If the env vars are absent the module is inert and the brief reports
// "mail: not connected" instead of inventing mail.
import { ImapFlow } from 'imapflow'

let client = null

export function gmailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}

async function connect() {
  if (client) return client
  client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    logger: false,
  })
  await client.connect()
  return client
}

// Returns up to `limit` unread messages: { from, subject, snippet, date }.
export async function unreadMail(limit = 3) {
  if (!gmailConfigured()) return { connected: false, items: [] }
  const imap = await connect()
  const lock = await imap.getMailboxLock('INBOX')
  try {
    const uids = await imap.search({ seen: false }, { uid: true })
    const take = uids.slice(-limit).reverse()
    const items = []
    for (const uid of take) {
      const msg = await imap.fetchOne(uid, { envelope: true, bodyParts: ['1'] }, { uid: true })
      const env = msg.envelope || {}
      const from = (env.from?.[0]?.address) || (env.from?.[0]?.name) || 'unknown'
      let snippet = ''
      try {
        const part = msg.bodyParts?.get('1')
        if (part) snippet = Buffer.from(part).toString('utf8').replace(/\s+/g, ' ').slice(0, 120)
      } catch { /* snippet is best-effort */ }
      items.push({ from, subject: env.subject || '(no subject)', snippet, date: env.date || null })
    }
    return { connected: true, items }
  } finally {
    lock.release()
  }
}
