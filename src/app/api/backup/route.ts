export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET() {
  try {
    const collections = ['clientes', 'ordens', 'categorias', 'status', 'usuarios'] as const
    const result: Record<string, unknown> = { timestamp: new Date().toISOString() }

    for (const name of collections) {
      const snap = await adminDb.collection(name).get()
      result[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    }

    const cfgSnap = await adminDb.collection('config').doc('geral').get()
    result['config'] = cfgSnap.exists ? cfgSnap.data() : {}

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error('GET /api/backup error:', err)
    return NextResponse.json({ error: 'Falha ao gerar backup' }, { status: 500 })
  }
}