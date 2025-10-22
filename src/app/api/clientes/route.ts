export const runtime = 'nodejs'

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/auth';

type Cliente = {
  id?: string;
  nome: string;
  whatsapp: string;
  createdAt?: string; // YYYY-MM-DD
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

export async function GET(req: Request) {
  const authed = await requireAuth()
  if (!authed) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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
  const authed = await requireAuth()
  if (!authed) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = (await request.json()) as Partial<Cliente>;
    if (!body.nome || !body.whatsapp) {
      return NextResponse.json({ error: 'Campos obrigatórios: nome e whatsapp' }, { status: 400 });
    }

    const nome = String(body.nome).toUpperCase().trim()
    const digits = onlyDigits(String(body.whatsapp))
    if (!(digits.length === 10 || digits.length === 11)) {
      return NextResponse.json({ error: 'WhatsApp inválido. Informe 10 ou 11 dígitos.' }, { status: 400 })
    }
    const whatsapp = maskWhatsapp(digits)

    // Verificar duplicidade por WhatsApp (único)
    const dupSnap = await adminDb.collection('clientes').where('whatsapp', '==', whatsapp).limit(1).get()
    if (!dupSnap.empty) {
      return NextResponse.json({ error: 'Já existe um cliente com este WhatsApp.' }, { status: 409 })
    }

    const cliente: Cliente = {
      nome,
      whatsapp,
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