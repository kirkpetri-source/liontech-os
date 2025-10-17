export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { signToken, verifyPassword } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { usuario?: string; senha?: string }
    const usuario = (body.usuario || '').trim().toLowerCase()
    const senha = String(body.senha || '')
    if (!usuario || !senha) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 })
    }

    const snap = await adminDb.collection('usuarios').where('usuario', '==', usuario).limit(1).get()
    if (snap.empty) return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    const doc = snap.docs[0]
    const data = doc.data() as any

    if (data.status && data.status !== 'ativo') {
      return NextResponse.json({ error: 'Usuário inativo' }, { status: 403 })
    }

    const hash = data.senhaHash
    if (!hash) return NextResponse.json({ error: 'Usuário sem senha definida' }, { status: 401 })
    const ok = await verifyPassword(senha, hash)
    if (!ok) return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })

    const token = signToken({ sub: doc.id, nome: data.nome, email: data.email, nivel: data.nivel })
    const res = NextResponse.json({ ok: true })
    res.cookies.set({ name: 'session', value: token, httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60, secure: process.env.NODE_ENV === 'production' })
    return res
  } catch (err) {
    console.error('POST /api/auth/login error:', err)
    return NextResponse.json({ error: 'Falha ao autenticar' }, { status: 500 })
  }
}