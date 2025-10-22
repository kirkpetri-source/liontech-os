export const runtime = 'nodejs'

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/auth';

type OrdemServico = {
  id?: string;
  numeroOS: string;
  clienteId: string;
  clienteNome: string;
  clienteWhatsapp: string;
  equipamentoModelo: string;
  equipamentoProblema: string;
  equipamentoSenha?: string;
  acessorios?: string;
  categoria: string;
  status: string;
  terceirizado: boolean;
  servicoTerceirizado?: string;
  rastreamentoExterno?: string;
  descricaoServico?: string;
  valor?: number;
  previsaoEntrega?: string;
  pago: boolean;
  valorPago?: number;
  valorEntrada?: number;
  formaPagamento?: string;
  formaPagamentoEntrada?: string;
  createdAt: string; // YYYY-MM-DD
};

export async function GET(req: Request) {
  const authed = await requireAuth()
  if (!authed) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const snapshot = await adminDb
      .collection('ordens')
      .orderBy('createdAt', 'desc')
      .get();

    const ordens: OrdemServico[] = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<OrdemServico, 'id'>;
      return { id: doc.id, ...data };
    });

    return NextResponse.json(ordens, { status: 200 });
  } catch (err) {
    console.error('GET /api/ordens error:', err);
    return NextResponse.json({ error: 'Falha ao listar ordens de serviço' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authed = await requireAuth()
  if (!authed) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = (await request.json()) as Partial<OrdemServico>;
    const required = [
      'clienteId',
      'clienteNome',
      'clienteWhatsapp',
      'equipamentoModelo',
      'equipamentoProblema',
      'categoria',
      'status',
    ] as const;

    for (const k of required) {
      if (!body[k]) return NextResponse.json({ error: `Campo obrigatório: ${k}` }, { status: 400 });
    }

    const numeroOS = body.numeroOS || `OS-${String(Date.now()).slice(-3)}`;

    const os: OrdemServico = {
      numeroOS,
      clienteId: String(body.clienteId),
      clienteNome: String(body.clienteNome).toUpperCase(),
      clienteWhatsapp: String(body.clienteWhatsapp),
      equipamentoModelo: String(body.equipamentoModelo).toUpperCase(),
      equipamentoProblema: String(body.equipamentoProblema).toUpperCase(),
      equipamentoSenha: body.equipamentoSenha ? String(body.equipamentoSenha) : undefined,
      acessorios: body.acessorios ? String(body.acessorios).toUpperCase() : undefined,
      categoria: String(body.categoria),
      status: String(body.status),
      terceirizado: Boolean(body.terceirizado),
      servicoTerceirizado: body.servicoTerceirizado ? String(body.servicoTerceirizado).toUpperCase() : undefined,
      rastreamentoExterno: body.rastreamentoExterno ? String(body.rastreamentoExterno) : undefined,
      descricaoServico: body.descricaoServico ? String(body.descricaoServico).toUpperCase() : undefined,
      valor: body.valor !== undefined ? Number(body.valor) : undefined,
      previsaoEntrega: body.previsaoEntrega ? String(body.previsaoEntrega) : undefined,
      pago: Boolean(body.pago),
      valorPago: body.valorPago !== undefined ? Number(body.valorPago) : undefined,
      valorEntrada: body.valorEntrada !== undefined ? Number(body.valorEntrada) : undefined,
      formaPagamento: body.formaPagamento ? String(body.formaPagamento) : undefined,
      formaPagamentoEntrada: body.formaPagamentoEntrada ? String(body.formaPagamentoEntrada) : undefined,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Verificar existência do cliente
    const clienteSnap = await adminDb.collection('clientes').doc(os.clienteId).get();
    if (!clienteSnap.exists) {
      return NextResponse.json({ error: 'Cliente não encontrado; cadastre ou selecione um cliente válido' }, { status: 400 });
    }

    const ref = await adminDb.collection('ordens').add(os);
    const created = { id: ref.id, ...os };
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/ordens error:', err);
    return NextResponse.json({ error: 'Falha ao criar ordem de serviço' }, { status: 500 });
  }
}