export const runtime = 'nodejs'

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/auth';

type Status = { id?: string; nome: string; descricao?: string; cor?: string };

export async function GET(req: Request) {
  const authed = await requireAuth()
  if (!authed) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const snap = await adminDb.collection('status').get();
    if (snap.empty) {
      return NextResponse.json([], { status: 200 });
    }
    const status: Status[] = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Status, 'id'>) }));
    return NextResponse.json(status, { status: 200 });
  } catch (err) {
    console.error('GET /api/status error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  const authed = await requireAuth()
  if (!authed) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = await req.json();
    if (!body || !body.nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }
    const data = {
      nome: body.nome,
      descricao: body.descricao || '',
      cor: body.cor || '#3B82F6',
      tipo: body.tipo || 'andamento',
      padrao: body.padrao ?? false,
      ordem: body.ordem ?? 1,
    };
    const ref = await adminDb.collection('status').add(data as any);
    const created = { id: ref.id, ...data };
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/status error:', err);
    return NextResponse.json({ error: 'Erro ao criar status' }, { status: 500 });
  }
}