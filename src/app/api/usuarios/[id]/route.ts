import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    const body = (await req.json()) as Record<string, unknown>

    const update: Record<string, unknown> = {}
    if ('nome' in body) update.nome = String(body.nome).toUpperCase()
    if ('email' in body) update.email = String(body.email).toLowerCase()
    if ('cargo' in body) update.cargo = String(body.cargo).toUpperCase()
    const passthrough = ['nivel', 'status', 'ultimoAcesso', 'dataCriacao'] as const
    for (const k of passthrough) if (k in body) update[k] = body[k as string]

    await adminDb.collection('usuarios').doc(id).set(update, { merge: true })
    const snap = await adminDb.collection('usuarios').doc(id).get()
    return NextResponse.json({ id, ...(snap.data() || {}) }, { status: 200 })
  } catch (err) {
    console.error('PUT /api/usuarios/[id] error:', err)
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    await adminDb.collection('usuarios').doc(id).delete()
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('DELETE /api/usuarios/[id] error:', err)
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 })
  }
}