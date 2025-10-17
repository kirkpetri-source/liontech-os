export const runtime = 'nodejs'

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

type ClienteUpdate = {
  nome?: string;
  whatsapp?: string;
};

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = (await request.json()) as ClienteUpdate;
    const update: Record<string, unknown> = {};

    if (body.nome !== undefined) update.nome = String(body.nome).toUpperCase();
    if (body.whatsapp !== undefined) update.whatsapp = String(body.whatsapp);

    await adminDb.collection('clientes').doc(id).update(update);
    const snap = await adminDb.collection('clientes').doc(id).get();
    const data = snap.data();
    if (!data) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });

    return NextResponse.json({ id, ...data }, { status: 200 });
  } catch (err) {
    console.error('PUT /api/clientes/[id] error:', err);
    return NextResponse.json({ error: 'Falha ao atualizar cliente' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await adminDb.collection('clientes').doc(id).delete();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('DELETE /api/clientes/[id] error:', err);
    return NextResponse.json({ error: 'Falha ao deletar cliente' }, { status: 500 });
  }
}