export const runtime = 'nodejs'

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/auth';
import { createEvolutionAPI } from '@/lib/evolution-api';
import { sendText as waSendText } from '@/lib/whatsapp-web';

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

    // Disparo de notificações automáticas
    try {
      const cfgSnap = await adminDb.collection('config').doc('geral').get()
      const cfg = (cfgSnap.data() || {}) as any
      const notifications = cfg?.notifications || { enabled: true, numbers: ['5564999555364'] }
      const enabled = notifications?.enabled !== false
      const numbers: string[] = Array.isArray(notifications?.numbers) && notifications.numbers.length > 0
        ? notifications.numbers
        : ['5564999555364']

      if (enabled && numbers.length > 0) {
        const evoCfg = cfg?.evolution || {}
        const evoCanSend = !!(evoCfg?.enabled && evoCfg?.baseUrl && evoCfg?.instanceName && evoCfg?.token)

        // Mensagem interna (controle operacional) conforme requisitos
        const now = new Date()
        const dt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(now)
        const resumo = (created.descricaoServico || created.equipamentoProblema || '').toString()
        const previsao = created.previsaoEntrega ? created.previsaoEntrega : '—'
        const rastreamento = created.rastreamentoExterno ? created.rastreamentoExterno : '—'
        const prioridade = 'Não definida' // Campo não existente nas O.S.; mantido informativo
        const message = [
          'Foi aberta uma nova O.S no sistema',
          '[Notificação Interna - Controle Operacional]',
          `O.S: ${created.numeroOS}`,
          `Tipo de Serviço: ${created.categoria}`,
          `Prioridade: ${prioridade}`,
          `Status Inicial: ${created.status}`,
          `Cliente: ${created.clienteNome}`,
          `Equipamento: ${created.equipamentoModelo}`,
          `Resumo: ${resumo || '—'}`,
          `Previsão: ${previsao}`,
          `Rastreamento: ${rastreamento}`,
          `Data/Hora: ${dt}`
        ].join('\n')

        // Helper para logar tentativas
        const logAttempt = async (to: string, channel: string, status: 'sent' | 'failed', error?: string) => {
          try {
            await adminDb.collection('notifications_logs').add({
              kind: 'os_created',
              osId: created.id,
              numeroOS: created.numeroOS,
              to,
              channel,
              status,
              error: error || null,
              createdAt: new Date().toISOString(),
              payloadPreview: message.slice(0, 500)
            })
          } catch (e) {
            console.error('Falha ao registrar log de notificação:', e)
          }
        }

        if (evoCanSend) {
          const api = createEvolutionAPI({ baseUrl: evoCfg.baseUrl, instanceName: evoCfg.instanceName, token: evoCfg.token, webhook: evoCfg.webhook })
          for (const to of numbers) {
            try {
              // Envio exclusivamente da mensagem interna de monitoramento
              await api.sendTextMessage(to, message)
              await logAttempt(to, 'evolution', 'sent')
            } catch (err: any) {
              const msg = typeof err?.message === 'string' ? err.message : String(err || '')
              console.error('Erro ao enviar via EvolutionAPI:', msg)
              await logAttempt(to, 'evolution', 'failed', msg)
              // Fallback para WhatsApp Web, se possível
              try {
                await waSendText(to, message)
                await logAttempt(to, 'whatsapp_web', 'sent')
              } catch (err2: any) {
                const msg2 = typeof err2?.message === 'string' ? err2.message : String(err2 || '')
                console.error('Erro no fallback WhatsApp Web:', msg2)
                await logAttempt(to, 'whatsapp_web', 'failed', msg2)
              }
            }
          }
        } else {
          // Sem EvolutionAPI ativo: tentar enviar apenas via WhatsApp Web
          for (const to of numbers) {
            try {
              await waSendText(to, message)
              await logAttempt(to, 'whatsapp_web', 'sent')
            } catch (err: any) {
              const msg = typeof err?.message === 'string' ? err.message : String(err || '')
              console.error('Erro ao enviar WhatsApp Web:', msg)
              await logAttempt(to, 'whatsapp_web', 'failed', msg)
            }
          }
        }
      }
    } catch (notifyErr) {
      console.error('Erro no fluxo de notificação automática:', notifyErr)
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/ordens error:', err);
    return NextResponse.json({ error: 'Falha ao criar ordem de serviço' }, { status: 500 });
  }
}