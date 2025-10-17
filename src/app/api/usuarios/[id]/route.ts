export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { requireAuth, hashPassword } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const authed = await requireAuth()
  if (!authed) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const id = params.id
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    const body = (await req.json()) as Record<string, unknown>

    // Validar duplicidade de e-mail ao atualizar (exclui o próprio registro)
    if ('email' in body && body.email) {
      const email = String(body.email).toLowerCase().trim()
      const snap = await adminDb.collection('usuarios').where('email', '==', email).limit(1).get()
      if (!snap.empty) {
        const doc = snap.docs[0]
        if (doc.id !== id) {
          return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
        }
      }
    }

    const update: Record<string, unknown> = {}
    if ('nome' in body) update.nome = String(body.nome).toUpperCase()
    if ('email' in body) update.email = String(body.email).toLowerCase()
    // Usuario é irreversível e não pode ser alterado após criação
    // if ('usuario' in body) update.usuario = String(body.usuario).toLowerCase()
    if ('senha' in body && body.senha) update.senhaHash = await hashPassword(String(body.senha))
    if ('cargo' in body) update.cargo = String(body.cargo).toUpperCase()
    const passthrough = ['nivel', 'status', 'ultimoAcesso', 'dataCriacao'] as const
    for (const k of passthrough) if (k in body) update[k] = body[k as string]

    await adminDb.collection('usuarios').doc(id).set(update, { merge: true })
    const snap = await adminDb.collection('usuarios').doc(id).get()
    const d = snap.data() as any
    const { senhaHash, ...rest } = d || {}
    return NextResponse.json({ id, ...rest }, { status: 200 })
  } catch (err) {
    console.error('PUT /api/usuarios/[id] error:', err)
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const authed = await requireAuth()
  if (!authed || authed.nivel !== 'admin') {
    return NextResponse.json({ error: 'Apenas admin pode excluir usuários' }, { status: 403 })
  }
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