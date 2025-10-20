import { NextResponse } from 'next/server'
import { resetClient } from '@/lib/whatsapp-web'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const clear = url.searchParams.get('clearSession') === '1'

    if (clear) {
      const sessionDir = path.join(process.cwd(), 'db/whatsapp-web-session')
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true })
      } catch (e) {
        console.warn('reset route: failed to remove session dir', e)
      }
    }

    await resetClient(clear ? 'manual reset with session clear' : 'manual reset')

    const res = NextResponse.json({ ok: true, cleared: clear })
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Headers', '*')
    return res
  } catch (e: any) {
    console.error('GET /api/whatsapp-web/reset error:', e)
    const msg = typeof e?.message === 'string' ? e.message : 'Falha ao resetar WhatsApp Web'
    const res = NextResponse.json({ ok: false, error: msg }, { status: 500 })
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Headers', '*')
    return res
  }
}