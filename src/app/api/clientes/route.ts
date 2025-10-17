export const runtime = 'nodejs'

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

type Cliente = {
  id?: string;
  nome: string;
  whatsapp: string;
  createdAt?: string; // YYYY-MM-DD
};

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('clientes')
      .orderBy('createdAt', 'desc')
      .get();

    const clientes: Cliente[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<Cliente, 'id'>;
      return {
        id: doc.id,
        nome: data.nome,
        whatsapp: data.whatsapp,
        createdAt: data.createdAt,
      };
    });

    return NextResponse.json(clientes, { status: 200 });
  } catch (err) {
    console.error('GET /api/clientes error:', err);
    return NextResponse.json({ error: 'Falha ao listar clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Cliente>;
    if (!body.nome || !body.whatsapp) {
      return NextResponse.json({ error: 'Campos obrigatórios: nome e whatsapp' }, { status: 400 });
    }

    const cliente: Cliente = {
      nome: String(body.nome).toUpperCase(),
      whatsapp: String(body.whatsapp),
      createdAt: new Date().toISOString().split('T')[0],
    };

    const ref = await adminDb.collection('clientes').add(cliente);
    const created = { id: ref.id, ...cliente };
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/clientes error:', err);
    return NextResponse.json({ error: 'Falha ao criar cliente' }, { status: 500 });
  }
}