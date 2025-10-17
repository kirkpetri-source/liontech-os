export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { hashPassword } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'

type Usuario = {
  id?: string
  nome: string
  email: string
  usuario?: string
  cargo: string
  nivel: 'admin' | 'gerente' | 'tecnico' | 'recepcao'
  status: 'ativo' | 'inativo'
  dataCriacao: string
  ultimoAcesso: string
}

export async function GET(req: Request) {
  const authed = await requireAuth()
  if (!authed) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const snap = await adminDb.collection('usuarios').orderBy('dataCriacao', 'desc').get()
    const usuarios: Usuario[] = snap.docs.map((doc) => {
      const d = doc.data() as any
      const { senhaHash, ...rest } = d
      return { id: doc.id, ...(rest as Omit<Usuario, 'id'>) }
    })
    return NextResponse.json(usuarios, { status: 200 })
  } catch (err) {
    console.error('GET /api/usuarios error:', err)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  const authed = await requireAuth()
  if (!authed || authed.nivel !== 'admin') {
    return NextResponse.json({ error: 'Apenas admin pode criar usuários' }, { status: 403 })
  }
  try {
    const body = (await req.json()) as Partial<Usuario & { senha?: string }>
    if (!body.nome || !body.email || !body.senha) {
      return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 })
    }

    const email = String(body.email).toLowerCase().trim()
    // Verificar se e-mail já existe
    const emailSnap = await adminDb.collection('usuarios').where('email', '==', email).limit(1).get()
    if (!emailSnap.empty) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }

    // Gerar usuario automaticamente a partir do nome: primeiro.segundo (sem acentos)
    const nomeLimpo = String(body.nome).trim()
    const partes = nomeLimpo.split(/\s+/).map(p => p.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    const primeiro = (partes[0] || '').toLowerCase()
    const segundo = (partes[1] || partes[0] || '').toLowerCase()
    const usuarioGerado = `${primeiro}.${segundo}`

    const novo: Omit<Usuario, 'id'> & { senhaHash: string } = {
      nome: String(body.nome).toUpperCase(),
      email,
      usuario: usuarioGerado,
      cargo: String(body.cargo || '').toUpperCase(),
      nivel: (body.nivel as any) || 'tecnico',
      status: (body.status as any) || 'ativo',
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      ultimoAcesso: 'Nunca',
      senhaHash: await hashPassword(String(body.senha))
    }

    const ref = await adminDb.collection('usuarios').add(novo)
    const { senhaHash, ...publicData } = novo
    const created = { id: ref.id, ...publicData }
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('POST /api/usuarios error:', err)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}