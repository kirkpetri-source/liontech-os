export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json()
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    await adminDb.collection('status').doc(id).set(body, { merge: true })
    const doc = await adminDb.collection('status').doc(id).get()
    return NextResponse.json({ id, ...(doc.data() || {}) }, { status: 200 })
  } catch (err) {
    console.error('PUT /api/status/[id] error:', err)
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    await adminDb.collection('status').doc(id).delete()
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('DELETE /api/status/[id] error:', err)
    return NextResponse.json({ error: 'Erro ao excluir status' }, { status: 500 })
  }
}