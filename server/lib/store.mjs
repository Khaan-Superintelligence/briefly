// Task + outbox store. Plain JSON file, no database, no account.
// Tasks are the user's real data: created by voice/tap, completed by tap.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const FILE = path.join(dir, '..', 'data.json')

function load() {
  if (!existsSync(FILE)) return { tasks: [], outbox: [] }
  try {
    return JSON.parse(readFileSync(FILE, 'utf8'))
  } catch {
    return { tasks: [], outbox: [] }
  }
}

function save(db) {
  writeFileSync(FILE, JSON.stringify(db, null, 2))
}

export function listTasks() {
  return load().tasks
}

export function addTask(text) {
  const db = load()
  const task = { id: Date.now().toString(36), text: text.slice(0, 120), done: false, createdAt: new Date().toISOString() }
  db.tasks.push(task)
  save(db)
  return task
}

export function toggleTask(id) {
  const db = load()
  const t = db.tasks.find((x) => x.id === id)
  if (!t) return null
  t.done = !t.done
  save(db)
  return t
}

export function deleteTask(id) {
  const db = load()
  db.tasks = db.tasks.filter((x) => x.id !== id)
  save(db)
}

export function listOutbox() {
  return load().outbox
}

export function sendOutbox(entry) {
  const db = load()
  const item = { id: Date.now().toString(36), ...entry, sentAt: new Date().toISOString() }
  db.outbox.push(item)
  save(db)
  return item
}
