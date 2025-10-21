import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js'
import QRCode from 'qrcode'
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'

export type WaStatus = 'init' | 'qr' | 'authenticated' | 'ready' | 'disconnected' | 'auth_failure'

type WaState = {
  status: WaStatus
  qr?: string
  qrDataUrl?: string
  lastError?: string
  me?: string
  ts?: number
  headless?: boolean
  executablePath?: string
}

const g: any = globalThis as any
if (!g.__wa) {
  g.__wa = {
    client: null as Client | null,
    state: { status: 'init' } as WaState,
    initializing: null as Promise<Client> | null,
    initializingAt: null as number | null,
  }
}

const store = g.__wa as any

const AUTO_RESET = process.env.WA_AUTO_RESET ? process.env.WA_AUTO_RESET === 'true' : true
function scheduleAutoReset(reason?: string, clearSession?: boolean) {
  if (!AUTO_RESET) return
  try {
    store.restartCount = (store.restartCount || 0) + 1
    const base = 3000
    const max = 60000
    const delay = Math.min(base * Math.pow(2, (store.restartCount - 1)), max)
    store.nextRestartAt = Date.now() + delay
    console.warn('whatsapp-web: auto-reset scheduled', { delay, reason, clearSession })
    setTimeout(async () => {
      try {
        if (clearSession) {
          const sessionDir = path.join(process.cwd(), 'db/whatsapp-web-session')
          try { fs.rmSync(sessionDir, { recursive: true, force: true }) } catch (e) { console.warn('auto-reset: failed to remove session dir', e) }
        }
        await resetClient(clearSession ? 'auto reset with session clear' : 'auto reset')
        ensureClient().catch(() => null)
      } catch (e) {
        console.error('auto-reset: failed to restart client', e)
      }
    }, delay)
  } catch (e) {
    console.error('auto-reset: schedule error', e)
  }
}


async function initClient(): Promise<Client> {
  if (store.client) return store.client
  if (store.initializing) return store.initializing

  // Bloquear em ambientes serverless (ex.: Vercel), que não suportam Chromium + filesystem persistente
  if (process.env.VERCEL === '1' || process.env.DISABLE_WHATSAPP_WEB === 'true') {
    const err = new Error('WhatsApp Web desabilitado neste ambiente (serverless).')
    store.state.lastError = err.message
    store.state.ts = Date.now()
    throw err
  }

  // Avoid optional native extensions issues in ws
  process.env.WS_NO_BUFFER_UTIL = '1'
  process.env.WS_NO_UTF_8_VALIDATE = '1'

  // Ensure Puppeteer knows the executable path and product
  try {
    const cftPath = puppeteer.executablePath()
    console.log('whatsapp-web: puppeteer executablePath =', cftPath)
    if (cftPath) {
      process.env.PUPPETEER_EXECUTABLE_PATH = cftPath
    }
  } catch (e) {
    console.warn('whatsapp-web: failed to resolve puppeteer executablePath', e)
  }
  // Resolver executablePath priorizando variável de ambiente ou Chrome for Testing
  const nestedChromium = path.join(process.cwd(), 'node_modules/whatsapp-web.js/node_modules/puppeteer-core/.local-chromium/mac-1045629/chrome-mac/Chromium.app/Contents/MacOS/Chromium')
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH
  const fromPuppeteer = (() => {
    try { return puppeteer.executablePath() } catch { return undefined }
  })()
  const execPath = fromEnv || fromPuppeteer || (fs.existsSync(nestedChromium) ? nestedChromium : undefined)
  if (execPath) process.env.PUPPETEER_EXECUTABLE_PATH = execPath
  // Não forçar PUPPETEER_PRODUCT; deixar padrão do puppeteer

  store.initializing = new Promise<Client>(async (resolve, reject) => {
    try {
      console.log('whatsapp-web: using executablePath in Client =', execPath)
      const client = new Client({
        authStrategy: new LocalAuth({
          dataPath: path.join(process.cwd(), 'db/whatsapp-web-session'),
        }),
        puppeteer: {
          headless: process.env.WA_HEADLESS ? process.env.WA_HEADLESS === 'true' : true,
          executablePath: execPath,
          args: [
            '--disable-dev-shm-usage',
            '--window-size=1280,720'
          ]
        },
        webVersionCache: ({
          type: 'none'
        } as any)
      })

      client.on('qr', async (qr) => {
        store.state.status = 'qr'
        store.state.qr = qr
        store.state.ts = Date.now()
        store.state.headless = process.env.WA_HEADLESS ? process.env.WA_HEADLESS === 'true' : true
        store.state.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
        try {
          const dataUrl = await QRCode.toDataURL(qr)
          store.state.qrDataUrl = dataUrl
          console.log('whatsapp-web: qr event (headless/executablePath)', { headless: store.state.headless, executablePath: store.state.executablePath })
        } catch (e) {
          console.warn('whatsapp-web: failed to convert QR to dataURL', e)
        }
      })

      // Additional debug to trace init progress
      client.on('loading_screen', (percent: any, message: any) => {
        try { console.log('whatsapp-web: loading_screen', { percent, message }) } catch {}
      })
      client.on('change_state', (state: any) => {
        try { console.log('whatsapp-web: change_state', state) } catch {}
      })

      client.on('ready', () => {
        store.state.status = 'ready'
        store.state.ts = Date.now()
        store.restartCount = 0
        store.nextRestartAt = null
      })

      client.on('authenticated', () => {
        store.state.status = 'authenticated'
        store.state.ts = Date.now()
        store.restartCount = 0
        store.nextRestartAt = null
      })

      client.on('auth_failure', (m) => {
        store.state.status = 'auth_failure'
        store.state.lastError = String(m || 'auth failure')
        store.state.ts = Date.now()
        scheduleAutoReset('auth_failure', true)
      })

      client.on('disconnected', (r) => {
        store.state.status = 'disconnected'
        store.state.lastError = String(r || 'disconnected')
        store.state.ts = Date.now()
        scheduleAutoReset('disconnected', false)
      })

      client.initialize().catch((e) => {
        store.state.lastError = typeof e?.message === 'string' ? e.message : String(e || '')
        store.state.ts = Date.now()
        console.error('whatsapp-web: initialize error', e)
        throw e
      })

      store.client = client
      store.initializingAt = Date.now()
      resolve(client)
    } catch (e) {
      reject(e)
    }
  })

  return store.initializing
}

export async function ensureClient(): Promise<Client> {
  return initClient()
}

export function getState() {
  return store.state
}

export function getInitAgeMs() {
  const t = store.initializingAt || 0
  return t ? (Date.now() - t) : 0
}

export async function resetClient(reason?: string) {
  try {
    const c = store.client as any
    if (c && typeof c.destroy === 'function') {
      try { await c.destroy() } catch {}
    }
  } catch {}
  store.client = null
  store.initializing = null as any
  store.initializingAt = null
  store.state = { status: 'init', lastError: undefined, qr: undefined, ts: Date.now(), headless: process.env.WA_HEADLESS ? process.env.WA_HEADLESS === 'true' : true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
  console.log('whatsapp-web: reset client', reason || '')
}

export async function getQrDataUrl(): Promise<string | undefined> {
  if (!store.client) await initClient()
  return store.state.qrDataUrl
}

// Resolve chat id a partir de E164
async function resolveChatId(toE164: string, client?: Client): Promise<string> {
  const c = client || await ensureClient()
  const jid = await c.getNumberId(toE164).catch(() => null)
  if (jid?._serialized) return jid._serialized
  // Tentar também com prefixo +
  const jidPlus = await c.getNumberId('+' + toE164).catch(() => null)
  if (jidPlus?._serialized) return jidPlus._serialized
  // Fallback: retorna JID direto mesmo sem validar existência prévia do chat
  return `${toE164}@c.us`
}

export async function sendText(toE164: string, body: string) {
  const client = await ensureClient()
  const chatId = await resolveChatId(toE164, client)
  return client.sendMessage(chatId, body)
}

export async function sendPdf(toE164: string, pdfBuffer: Buffer, filename: string, caption?: string) {
  const client = await ensureClient()
  const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), filename)
  const chatId = await resolveChatId(toE164, client)
  // Force sending as document and retry without caption if WA rejects body
  try {
    return await client.sendMessage(chatId, media, { caption: caption ? String(caption) : undefined, sendMediaAsDocument: true } as any)
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : String(err || '')
    if (/Evaluation failed|currentMsg\.body/i.test(msg)) {
      // Retry without caption to avoid invalid body encoding in WA Web
      return await client.sendMessage(chatId, media, { sendMediaAsDocument: true } as any)
    }
    throw err
  }
}