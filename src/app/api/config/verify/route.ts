export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { verifyPassword } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { password } = (await req.json()) as { password?: string }

    const snap = await adminDb.collection('config').doc('geral').get()
    const cfg = (snap.data() || {}) as any
    const storedHash: string | undefined = cfg?.seguranca?.configKeyHash
    const envKey = process.env.ADMIN_CONFIG_PASSWORD

    if (storedHash) {
      if (!password) return NextResponse.json({ ok: false }, { status: 401 })
      const ok = await verifyPassword(password, storedHash)
      return ok
        ? NextResponse.json({ ok: true }, { status: 200 })
        : NextResponse.json({ ok: false }, { status: 401 })
    }

    if (envKey) {
      const ok = password === envKey
      return ok
        ? NextResponse.json({ ok: true }, { status: 200 })
        : NextResponse.json({ ok: false }, { status: 401 })
    }

    // Sem proteção definida -> considerado desbloqueado
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    console.error('POST /api/config/verify error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}