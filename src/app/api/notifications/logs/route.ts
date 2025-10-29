export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET() {
  try {
    const snap = await adminDb
      .collection('notifications_logs')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ ok: true, items }, { status: 200 })
  } catch (err) {
    console.error('GET /api/notifications/logs error:', err)
    return NextResponse.json({ ok: false, error: 'Falha ao carregar logs' }, { status: 500 })
  }
}