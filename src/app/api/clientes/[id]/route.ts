export const runtime = 'nodejs'

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/auth';

type ClienteUpdate = {
  nome?: string;
  whatsapp?: string;
};

function onlyDigits(s: string) {
  return (s || '').replace(/\D/g, '')
}

function maskWhatsapp(w: string) {
  const d = onlyDigits(w)
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return w
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authed = await requireAuth()
  if (!authed) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { id } = params;
    const body = (await request.json()) as ClienteUpdate;
    const update: Record<string, unknown> = {};

    if (body.nome !== undefined) update.nome = String(body.nome).toUpperCase();
    if (body.whatsapp !== undefined) {
      const digits = onlyDigits(String(body.whatsapp))
      if (!(digits.length === 10 || digits.length === 11)) {
        return NextResponse.json({ error: 'WhatsApp inválido. Informe 10 ou 11 dígitos.' }, { status: 400 })
      }
      const whatsapp = maskWhatsapp(digits)

      // Bloquear duplicidade em outro registro
      const dupSnap = await adminDb.collection('clientes').where('whatsapp', '==', whatsapp).limit(1).get()
      if (!dupSnap.empty && dupSnap.docs[0].id !== id) {
        return NextResponse.json({ error: 'Já existe um cliente com este WhatsApp.' }, { status: 409 })
      }

      update.whatsapp = whatsapp
    }

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
  const authed = await requireAuth()
  if (!authed) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { id } = params;
    await adminDb.collection('clientes').doc(id).delete();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('DELETE /api/clientes/[id] error:', err);
    return NextResponse.json({ error: 'Falha ao deletar cliente' }, { status: 500 });
  }
}