export const runtime = 'nodejs'

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = (await request.json()) as Record<string, unknown>;
    const update: Record<string, unknown> = {};

    // Normalização de campos textuais para maiúsculas onde aplicável
    const toUpper = (v: unknown) => (typeof v === 'string' ? v.toUpperCase() : v);

    if ('clienteNome' in body) update.clienteNome = toUpper(body.clienteNome);
    if ('equipamentoModelo' in body) update.equipamentoModelo = toUpper(body.equipamentoModelo);
    if ('equipamentoProblema' in body) update.equipamentoProblema = toUpper(body.equipamentoProblema);
    if ('acessorios' in body) update.acessorios = toUpper(body.acessorios);
    if ('servicoTerceirizado' in body) update.servicoTerceirizado = toUpper(body.servicoTerceirizado);
    if ('descricaoServico' in body) update.descricaoServico = toUpper(body.descricaoServico);

    // Demais campos (mantém valores conforme enviados)
    const passthroughKeys = [
      'numeroOS',
      'clienteWhatsapp',
      'equipamentoSenha',
      'categoria',
      'status',
      'terceirizado',
      'rastreamentoExterno',
      'valor',
      'previsaoEntrega',
      'pago',
      'valorPago',
      'valorEntrada',
      'formaPagamento',
      'formaPagamentoEntrada',
    ] as const;

    for (const k of passthroughKeys) {
      if (k in body) update[k] = body[k as string];
    }

    await adminDb.collection('ordens').doc(id).update(update);
    const snap = await adminDb.collection('ordens').doc(id).get();
    const data = snap.data();
    if (!data) return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 });

    return NextResponse.json({ id, ...data }, { status: 200 });
  } catch (err) {
    console.error('PUT /api/ordens/[id] error:', err);
    return NextResponse.json({ error: 'Falha ao atualizar ordem de serviço' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await adminDb.collection('ordens').doc(id).delete();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('DELETE /api/ordens/[id] error:', err);
    return NextResponse.json({ error: 'Falha ao deletar ordem de serviço' }, { status: 500 });
  }
}