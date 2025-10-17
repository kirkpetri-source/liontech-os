export const runtime = 'nodejs'

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

type Categoria = { id?: string; nome: string; descricao?: string };

export async function GET() {
  try {
    const snap = await adminDb.collection('categorias').get();
    if (snap.empty) {
      // Sem categorias cadastradas nas configurações do sistema
      return NextResponse.json([], { status: 200 });
    }
    const categorias: Categoria[] = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Categoria, 'id'>) }));
    return NextResponse.json(categorias, { status: 200 });
  } catch (err) {
    console.error('GET /api/categorias error:', err);
    // Em caso de erro, não retornar opções adicionais
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }
    const data = {
      nome: body.nome,
      descricao: body.descricao || '',
      cor: body.cor || '#3B82F6',
      ativa: body.ativa ?? true,
      quantidadeOS: body.quantidadeOS ?? 0,
    };
    const ref = await adminDb.collection('categorias').add(data as any);
    const created = { id: ref.id, ...data };
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/categorias error:', err);
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}