export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { ensureClient, getState, getQrDataUrl, getInitAgeMs, resetClient } from '@/lib/whatsapp-web'

const g: any = globalThis as any
if (!g.__waQrFallbackAt) g.__waQrFallbackAt = 0

export async function GET(request: Request) {
  try {
    // Bloquear em ambientes serverless (ex.: Vercel), que não suportam WhatsApp Web + Chromium
    if (process.env.VERCEL === '1' || process.env.DISABLE_WHATSAPP_WEB === 'true') {
      const res = NextResponse.json({ ok: false, state: 'disabled', error: 'WhatsApp Web não é suportado neste ambiente. Use deploy Docker + servidor.' }, { status: 503 })
      res.headers.set('Access-Control-Allow-Origin', '*')
      res.headers.set('Access-Control-Allow-Headers', '*')
      res.headers.set('Retry-After', '600')
      return res
    }

    // Inicializa de forma assíncrona para não bloquear a resposta
    ensureClient().catch(() => null)

    // Watchdog: se estiver carregando por muito tempo, reinicia cliente
    const age = getInitAgeMs()
    const raw = getState()
    if ((raw.status === 'init' || raw.status === 'auth_failure') && typeof age === 'number' && age > 30000) {
      console.warn('qr route: reinitializing whatsapp-web client after stale init', { age })
      await resetClient('stale init; auto-restart')
      ensureClient().catch(() => null)
      // Evitar reset imediato via fallback em seguida
      g.__waQrFallbackAt = Date.now()
    }

    let mapped = (raw.status === 'ready' || raw.status === 'authenticated') ? 'connected'
      : raw.status === 'qr' ? 'qr'
      : raw.status === 'auth_failure' ? 'disconnected'
      : raw.status === 'init' ? 'loading'
      : raw.status
    // Não bloquear buscando QR; usar o último gerado no estado
    let qrOut = mapped === 'qr' ? (raw.qrDataUrl || null) : null

    // Opcional: fallback apenas quando explicitamente solicitado via query (?fallback=1)
    const url = new URL(request.url)
    const force = url.searchParams.get('fallback') === '1' // manter compatibilidade de query
    const now = Date.now()
    const canFallback = force && now - (g.__waQrFallbackAt || 0) > 10000
    if (canFallback && (raw.status === 'init' || raw.status === 'auth_failure')) {
      g.__waQrFallbackAt = now
      await resetClient('force refresh via qr route')
      ensureClient().catch(() => null)
    }
    // Se solicitado force refresh e ainda sem QR, aguarda brevemente até 3s
    if (force && mapped === 'loading') {
      const started = Date.now()
      while (Date.now() - started < 3000) {
        await new Promise((r) => setTimeout(r, 250))
        const cur = getState()
        mapped = (cur.status === 'ready' || cur.status === 'authenticated') ? 'connected'
          : cur.status === 'qr' ? 'qr'
          : cur.status === 'auth_failure' ? 'disconnected'
          : cur.status === 'init' ? 'loading'
          : cur.status as any
        if (mapped === 'qr' && cur.qrDataUrl) {
          qrOut = cur.qrDataUrl
          break
        }
      }
    }

    const res = NextResponse.json({ ok: true, state: mapped, qr: qrOut, ts: raw.ts, age, debug: { headless: (raw.headless ?? null) as any, executablePath: (raw.executablePath ?? process.env.PUPPETEER_EXECUTABLE_PATH ?? null) as any, WA_HEADLESS: (process.env.WA_HEADLESS ?? null) as any } })
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Headers', '*')
    return res
  } catch (e: any) {
    console.error('GET /api/whatsapp-web/qr error:', e)
    const msg = typeof e?.message === 'string' ? e.message : 'Falha ao inicializar WhatsApp Web'
    const res = NextResponse.json({ ok: false, error: msg }, { status: 500 })
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Headers', '*')
    return res
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 })
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Headers', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS')
  return res
}