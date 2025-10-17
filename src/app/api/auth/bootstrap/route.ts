export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { hashPassword } from '@/lib/auth'
import crypto from 'crypto'

function genPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_-'
  const bytes = crypto.randomBytes(length)
  let pass = ''
  for (let i = 0; i < length; i++) {
    pass += chars[bytes[i] % chars.length]
  }
  return pass
}

export async function POST(req: Request) {
  try {
    // Verificar se já existe um usuário admin
    const adminExistsSnap = await adminDb
      .collection('usuarios')
      .where('nivel', '==', 'admin')
      .limit(1)
      .get()
    if (!adminExistsSnap.empty) {
      return NextResponse.json({ error: 'Já existe um usuário admin. Bootstrap não permitido.' }, { status: 409 })
    }

    // Opcional: exigir segredo via header se BOOTSTRAP_SECRET estiver definido
    const secret = process.env.BOOTSTRAP_SECRET
    if (secret) {
      const provided = req.headers.get('x-bootstrap-secret') || ''
      if (provided !== secret) {
        return NextResponse.json({ error: 'Segredo inválido para bootstrap' }, { status: 401 })
      }
    }

    const body = (await req.json().catch(() => ({}))) as {
      usuario?: string
      senha?: string
      nome?: string
      email?: string
    }

    const usuario = (body.usuario || 'admin').toLowerCase()
    const senha = body.senha || genPassword(14)
    const nome = (body.nome || 'ADMINISTRADOR').toUpperCase()
    const email = (body.email || 'admin@local').toLowerCase()

    const novo = {
      nome,
      email,
      usuario,
      cargo: 'ADMIN',
      nivel: 'admin' as const,
      status: 'ativo' as const,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      ultimoAcesso: 'Nunca',
      senhaHash: await hashPassword(senha)
    }

    const ref = await adminDb.collection('usuarios').add(novo)
    return NextResponse.json(
      {
        id: ref.id,
        usuario,
        senhaGerada: body.senha ? undefined : senha,
        message: body.senha ? 'Admin criado com a senha fornecida.' : 'Admin criado com senha gerada. Altere após login.'
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/auth/bootstrap error:', err)
    return NextResponse.json({ error: 'Falha ao criar admin inicial' }, { status: 500 })
  }
}