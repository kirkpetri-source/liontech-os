import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

type Usuario = {
  id?: string
  nome: string
  email: string
  cargo: string
  nivel: 'admin' | 'gerente' | 'tecnico' | 'recepcao'
  status: 'ativo' | 'inativo'
  dataCriacao: string
  ultimoAcesso: string
}

export async function GET() {
  try {
    const snap = await adminDb.collection('usuarios').orderBy('dataCriacao', 'desc').get()
    const usuarios: Usuario[] = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Usuario, 'id'>) }))
    return NextResponse.json(usuarios, { status: 200 })
  } catch (err) {
    console.error('GET /api/usuarios error:', err)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Usuario & { senha?: string }>
    if (!body.nome || !body.email) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios' }, { status: 400 })
    }

    const novo: Omit<Usuario, 'id'> = {
      nome: String(body.nome).toUpperCase(),
      email: String(body.email).toLowerCase(),
      cargo: String(body.cargo || '').toUpperCase(),
      nivel: (body.nivel as any) || 'tecnico',
      status: (body.status as any) || 'ativo',
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      ultimoAcesso: 'Nunca',
    }

    const ref = await adminDb.collection('usuarios').add(novo)
    const created = { id: ref.id, ...novo }
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('POST /api/usuarios error:', err)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}