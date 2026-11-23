// Briefly — heads-up AI work brief for Even Realities G2.
// Track 04 AI Assistants & Work (main) + Track 03 Exchanges & Stocks
// (live market card, Coinbase public data).
//
// Screens: Brief -> Tasks -> Ask -> Brief (tap advances; scroll selects).
// Tap = the current screen's primary action; double-tap = exit dialog.
// Navigation never depends on containerID: each list ends with a
// "go to next screen" pseudo-item, so tap + scroll alone reach everything.
import {
  waitForEvenAppBridge,
  TextContainerProperty,
  ListContainerProperty,
  ListItemContainerProperty,
  CreateStartUpPageContainer,
  RebuildPageContainer,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'
import { api, type Brief, type Task } from './api'

const BUILD = 'b1'
const W = 576
const H = 288

// ---- helpers -------------------------------------------------------------
function wrap(text: string, width = 46): string[] {
  const lines: string[] = []
  for (const raw of String(text).split('\n')) {
    let line = raw
    while (line.length > width) {
      let cut = line.lastIndexOf(' ', width)
      if (cut <= 0) cut = width
      lines.push(line.slice(0, cut))
      line = line.slice(cut).trimStart()
    }
    lines.push(line)
  }
  return lines
}

function fit(lines: string[], maxLines = 6): string {
  return lines.slice(0, maxLines).join('\n')
}

function timeNow(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function eventTypeOf(envelope?: { eventType?: OsEventTypeList }): OsEventTypeList | null {
  if (!envelope) return null
  return envelope.eventType ?? OsEventTypeList.CLICK_EVENT
}

// ---- state ---------------------------------------------------------------
type Screen = 'brief' | 'tasks' | 'ask'
let screen: Screen = 'brief'
let brief: Brief | null = null
let tasks: Task[] = []
let taskSel = 0
let askSel = 0
let askMode: 'list' | 'answer' | 'draft' | 'sent' = 'list'
let askText = ''
let loading = false
let lastError = ''

const ASK_ITEMS = [
  "What's next?",
  'Summarize the top news',
  'How is BTC doing?',
  'Draft a reply',
]

// ---- bridge (serialized writes) ------------------------------------------
const bridge = await waitForEvenAppBridge()
let chain: Promise<unknown> = Promise.resolve()
function queue(fn: () => Promise<unknown>): void {
  chain = chain.then(fn).catch((e) => console.error('bridge write failed:', e))
}

function textBox(id: number, y: number, h: number, content: string): TextContainerProperty {
  return new TextContainerProperty({
    xPosition: 0, yPosition: y, width: W, height: h,
    borderWidth: 0, borderColor: 5, paddingLength: 4,
    containerID: id, containerName: `t${id}`, content, isEventCapture: 1,
  })
}

function header(title: string): string {
  return `BRIEFLY ${BUILD} · ${title}   [tap: next]`
}

// ---- renderers ------------------------------------------------------------
function renderBrief(): void {
  const lines: string[] = [header(`Brief · ${timeNow()}`), '']
  if (!brief) {
    lines.push(loading ? 'Loading…' : lastError ? `Backend offline` : 'No data yet')
    if (lastError) lines.push('Start server: cd server && npm start')
  } else {
    const next = brief.next
      ? `${brief.nextSource === 'calendar' ? 'Meeting' : 'Next'}: ${brief.next.title}`
      : 'No next item'
    lines.push(...wrap(next))
    const mail = brief.mail.connected
      ? `Mail: ${brief.mail.unread} unread${brief.mail.top ? ` · ${brief.mail.top.subject}` : ''}`
      : `Mail: not connected · ${brief.openCount} open tasks`
    lines.push(...wrap(mail))
    if (brief.marketLine) lines.push(...wrap(brief.marketLine))
    if (brief.newsTop) lines.push(...wrap(`Top: ${brief.newsTop}`))
  }
  lines.push('', 'Tap: tasks · Scroll: switch')
  queue(() =>
    bridge.rebuildPageContainer(new RebuildPageContainer({
      containerTotalNum: 1,
      textObject: [textBox(2, 0, H, fit(lines))],
    })),
  )
}

function renderTasks(): void {
  const items = tasks.map((t) => `${t.done ? '[x]' : '[ ]'} ${t.text}`)
  items.push('— Ask the AI ▸ —')
  const list = new ListContainerProperty({
    xPosition: 0, yPosition: 36, width: W, height: H - 36,
    borderWidth: 0, borderColor: 5, paddingLength: 2,
    containerID: 3, containerName: 'tasks',
    itemContainer: new ListItemContainerProperty({
      itemCount: items.length,
      itemWidth: W - 8,
      isItemSelectBorderEn: 1,
      itemName: items,
    }),
    isEventCapture: 1,
  })
  queue(() =>
    bridge.rebuildPageContainer(new RebuildPageContainer({
      containerTotalNum: 2,
      textObject: [textBox(1, 0, 36, header(`Tasks · ${tasks.filter((t) => !t.done).length} open`))],
      listObject: [list],
    })),
  )
}

function renderAsk(): void {
  const lines: string[] = [header('Ask the AI'), '']
  if (askMode === 'list') {
    ASK_ITEMS.forEach((q, i) => lines.push(`${i === askSel ? '▸ ' : '  '}${q}`))
    lines.push('— Back to Brief —')
    lines.push('', 'Scroll: pick · Tap: ask')
  } else if (askMode === 'answer' || askMode === 'draft') {
    lines.push(...wrap(askText))
    lines.push('', askMode === 'draft' ? 'Tap: approve & log · Scroll: back' : 'Tap: back to questions')
  } else {
    lines.push(...wrap(askText))
    lines.push('', 'Tap: back to questions')
  }
  queue(() =>
    bridge.rebuildPageContainer(new RebuildPageContainer({
      containerTotalNum: 1,
      textObject: [textBox(2, 0, H, fit(lines))],
    })),
  )
}

function render(): void {
  if (screen === 'brief') renderBrief()
  else if (screen === 'tasks') renderTasks()
  else renderAsk()
}

function nextScreen(): void {
  screen = screen === 'brief' ? 'tasks' : screen === 'tasks' ? 'ask' : 'brief'
  askMode = 'list'
  render()
}

// ---- data -----------------------------------------------------------------
async function refreshAll(): Promise<void> {
  loading = true
  try {
    const [b, t] = await Promise.all([api.brief(), api.tasks()])
    brief = b
    tasks = t.tasks
    lastError = ''
  } catch (e) {
    lastError = String(e instanceof Error ? e.message : e)
  } finally {
    loading = false
  }
}

async function runAsk(): Promise<void> {
  const q = ASK_ITEMS[askSel]
  askMode = 'answer'
  askText = 'Asking…'
  renderAsk()
  try {
    if (q === "What's next?") {
      askText = brief?.next ? `Next: ${brief.next.title}` : 'Nothing open. Nice.'
    } else if (q === 'Summarize the top news') {
      const b = brief ?? (await api.brief())
      const heads = (b.news || []).slice(0, 3).map((n) => n.title).join(' | ')
      const r = await api.ask(`Summarize these headlines in one short sentence: ${heads}`)
      askText = r.answer
    } else if (q === 'How is BTC doing?') {
      const b = brief ?? (await api.brief())
      askText = b.marketLine || 'Market data unavailable.'
    } else {
      const ctx = brief?.mail?.top
        ? `Reply to ${brief.mail.top.from} about "${brief.mail.top.subject}": ${brief.mail.top.snippet || ''}`
        : brief?.next
          ? `Reply about "${brief.next.title}"`
          : 'A teammate asks for a status update'
      const r = await api.draft(ctx)
      askText = r.draft
      askMode = 'draft'
    }
  } catch (e) {
    askText = `AI unavailable: ${String(e instanceof Error ? e.message : e).slice(0, 60)}`
  }
  renderAsk()
}

async function approveDraft(): Promise<void> {
  try {
    await api.send(askText, brief?.mail?.top?.from || 'teammate')
    askText = 'Approved ✓ logged to outbox.'
  } catch (e) {
    askText = `Could not log: ${String(e instanceof Error ? e.message : e).slice(0, 60)}`
  }
  askMode = 'sent'
  renderAsk()
}

// ---- boot -----------------------------------------------------------------
await refreshAll()
await bridge.createStartUpPageContainer(
  new CreateStartUpPageContainer({
    containerTotalNum: 1,
    textObject: [textBox(2, 0, H, 'BRIEFLY — loading…')],
  }),
)
render()

// ---- events ---------------------------------------------------------------
bridge.onEvenHubEvent((event) => {
  const sysType = eventTypeOf(event.sysEvent)
  const textType = eventTypeOf(event.textEvent)
  const listType = eventTypeOf(event.listEvent)

  if (
    sysType === OsEventTypeList.DOUBLE_CLICK_EVENT ||
    textType === OsEventTypeList.DOUBLE_CLICK_EVENT ||
    listType === OsEventTypeList.DOUBLE_CLICK_EVENT
  ) {
    bridge.shutDownPageContainer(1)
    return
  }

  // List tap: toggle the tapped task, or jump to Ask from the pseudo-item.
  if (event.listEvent && (listType === OsEventTypeList.CLICK_EVENT)) {
    const idx = event.listEvent.currentSelectItemIndex ?? taskSel
    if (idx === tasks.length) {
      screen = 'ask'
      askMode = 'list'
      render()
      return
    }
    const t = tasks[idx]
    if (t) {
      taskSel = idx
      queue(async () => {
        try {
          await api.toggleTask(t.id)
          tasks = (await api.tasks()).tasks
        } catch (e) {
          console.error('toggle failed:', e)
        }
        renderTasks()
      })
    }
    return
  }

  // Scroll: move selection on the current screen.
  if (
    sysType === OsEventTypeList.SCROLL_TOP_EVENT ||
    textType === OsEventTypeList.SCROLL_TOP_EVENT ||
    sysType === OsEventTypeList.SCROLL_BOTTOM_EVENT ||
    textType === OsEventTypeList.SCROLL_BOTTOM_EVENT
  ) {
    const down = sysType === OsEventTypeList.SCROLL_BOTTOM_EVENT || textType === OsEventTypeList.SCROLL_BOTTOM_EVENT
    if (screen === 'tasks') {
      taskSel = Math.max(0, Math.min(tasks.length, taskSel + (down ? 1 : -1)))
      renderTasks()
    } else if (screen === 'ask' && askMode === 'list') {
      const max = ASK_ITEMS.length // last index = Back to Brief
      askSel = Math.max(0, Math.min(max, askSel + (down ? 1 : -1)))
      renderAsk()
    } else if (screen === 'brief') {
      nextScreen()
    }
    return
  }

  // Tap: the current screen's primary action.
  if (
    sysType === OsEventTypeList.CLICK_EVENT ||
    textType === OsEventTypeList.CLICK_EVENT
  ) {
    if (screen === 'brief') {
      nextScreen()
    } else if (screen === 'tasks') {
      const t = tasks[taskSel]
      if (taskSel === tasks.length) {
        screen = 'ask'
        askMode = 'list'
        render()
      } else if (t) {
        queue(async () => {
          try {
            await api.toggleTask(t.id)
            tasks = (await api.tasks()).tasks
          } catch (e) {
            console.error('toggle failed:', e)
          }
          renderTasks()
        })
      }
    } else if (screen === 'ask') {
      if (askMode === 'list') {
        if (askSel === ASK_ITEMS.length) {
          screen = 'brief'
          render()
        } else {
          void runAsk()
        }
      } else if (askMode === 'draft') {
        void approveDraft()
      } else {
        askMode = 'list'
        renderAsk()
      }
    }
  }
})
