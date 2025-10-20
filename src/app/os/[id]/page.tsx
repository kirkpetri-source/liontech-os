export const runtime = 'nodejs'

import { adminDb } from '@/lib/firebase-admin'
import crypto from 'crypto'

function hmacToken(secret: string | null, id: string) {
  if (!secret) return null
  try {
    return crypto.createHmac('sha256', secret).update(id).digest('hex')
  } catch {
    return null
  }
}

function maskWhatsapp(w: string) {
  const d = (w || '').replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return w || '-'
}

export default async function OSView({ params, searchParams }: { params: { id: string }, searchParams: { t?: string } }) {
  const id = params.id
  const token = searchParams?.t || null

  const cfgSnap = await adminDb.collection('config').doc('geral').get()
  const cfg = (cfgSnap.data() || {}) as any
  const secret = (cfg?.whatsapp?.osShareSecret) || process.env.OS_SHARE_SECRET || process.env.ADMIN_CONFIG_PASSWORD || null
  if (!secret) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center p-6">
        <div className="max-w-xl w-full text-center">
          <h1 className="text-2xl font-semibold">Link indisponível</h1>
          <p className="mt-2 text-slate-600">Configuração de segurança ausente. Contate a empresa para obter o link correto.</p>
        </div>
      </div>
    )
  }

  const snap = await adminDb.collection('ordens').doc(id).get()
  const os = snap.data() as any
  if (!os) return (
    <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-2xl font-semibold">O.S. não encontrada</h1>
        <p className="mt-2 text-slate-600">Verifique o link recebido.</p>
      </div>
    </div>
  )

  const expected = hmacToken(secret, id)
  if (expected && token !== expected) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center p-6">
        <div className="max-w-xl w-full text-center">
          <h1 className="text-2xl font-semibold">Link inválido</h1>
          <p className="mt-2 text-slate-600">Este link de visualização não é válido ou expirou.</p>
        </div>
      </div>
    )
  }

  const empresa = cfg.empresa || {}

  const previsao = os.previsaoEntrega
    ? (String(os.previsaoEntrega).includes('T')
        ? new Date(os.previsaoEntrega).toLocaleString('pt-BR')
        : new Date(os.previsaoEntrega).toLocaleDateString('pt-BR'))
    : 'Não definida'

  const formatBRL = (v?: number) => typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : undefined
  const total = typeof os.valor === 'number' ? formatBRL(os.valor) : undefined
  const entrada = typeof os.valorEntrada === 'number' ? formatBRL(os.valorEntrada) : undefined
  const pago = typeof os.valorPago === 'number' ? formatBRL(os.valorPago) : undefined
  const saldo = (os.valor || 0) - (os.valorPago || 0) - (os.valorEntrada || 0)
  const saldoBRL = formatBRL(saldo)

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="max-w-3xl mx-auto p-6">
        <header className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            <img src={empresa.logoUrl || '/logo.svg'} alt="Logo" className="w-16 h-16 object-contain" />
            <div>
              <div className="text-xl font-bold">{empresa.nome || 'Lion Tech'}</div>
              <div className="text-sm text-slate-600">{empresa.endereco || ''}</div>
              <div className="text-sm text-slate-600">{empresa.telefone || ''}{empresa.email ? ' • ' + empresa.email : ''}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Ordem de Serviço</div>
            <div className="text-xl font-bold text-blue-600">{os.numeroOS}</div>
            <div className="inline-flex items-center px-2 py-1 rounded-full text-white text-xs font-semibold mt-2" style={{ backgroundColor: os.status === 'Concluído' ? '#16a34a' : os.status === 'Em Andamento' ? '#2563eb' : os.status === 'Entregue' ? '#10b981' : '#f59e0b' }}>{os.status}</div>
          </div>
        </header>

        <main className="mt-6 space-y-6">
          <section className="border rounded-md">
            <div className="bg-slate-50 border-b px-4 py-2 font-semibold">Dados do Cliente</div>
            <div className="p-4 grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-600">Nome</div>
                <div className="font-semibold">{os.clienteNome}</div>
              </div>
              <div>
                <div className="text-slate-600">WhatsApp</div>
                <div className="font-semibold">{maskWhatsapp(os.clienteWhatsapp)}</div>
              </div>
            </div>
          </section>

          <section className="border rounded-md">
            <div className="bg-slate-50 border-b px-4 py-2 font-semibold">Equipamento</div>
            <div className="p-4 grid gap-3 text-sm">
              <div className="grid grid-cols-[max-content_1fr] gap-3"><div className="text-slate-600 font-semibold">Categoria</div><div className="font-semibold">{os.categoria}</div></div>
              <div className="grid grid-cols-[max-content_1fr] gap-3"><div className="text-slate-600 font-semibold">Modelo</div><div className="font-semibold">{os.equipamentoModelo}</div></div>
              <div className="grid grid-cols-[max-content_1fr] gap-3"><div className="text-slate-600 font-semibold">Problema</div><div className="font-semibold">{os.equipamentoProblema}</div></div>
              {os.acessorios ? (<div className="grid grid-cols-[max-content_1fr] gap-3"><div className="text-slate-600 font-semibold">Acessórios</div><div className="font-semibold">{os.acessorios}</div></div>) : null}
              {/* Não exibir senha do equipamento para segurança */}
            </div>
          </section>

          <section className="border rounded-md">
            <div className="bg-slate-50 border-b px-4 py-2 font-semibold">Serviço</div>
            <div className="p-4 grid gap-3 text-sm">
              <div className="grid grid-cols-[max-content_1fr] gap-3"><div className="text-slate-600 font-semibold">Previsão</div><div className="font-semibold">{previsao}</div></div>
              {os.descricaoServico ? (<div className="grid grid-cols-[max-content_1fr] gap-3"><div className="text-slate-600 font-semibold">Descrição</div><div className="font-semibold whitespace-pre-wrap">{os.descricaoServico}</div></div>) : null}
              {os.terceirizado ? (<div className="grid grid-cols-[max-content_1fr] gap-3"><div className="text-slate-600 font-semibold">Terceirizado</div><div className="font-semibold">{os.servicoTerceirizado || '—'}</div></div>) : null}
              {os.rastreamentoExterno ? (<div className="grid grid-cols-[max-content_1fr] gap-3"><div className="text-slate-600 font-semibold">Rastreamento</div><div className="font-semibold break-all"><a className="text-blue-700 hover:underline" href={os.rastreamentoExterno} target="_blank" rel="noopener noreferrer">{os.rastreamentoExterno}</a></div></div>) : null}
            </div>
          </section>

          {(typeof os.valor === 'number' || typeof os.valorEntrada === 'number' || typeof os.valorPago === 'number') && (
            <section className="border rounded-md">
              <div className="bg-slate-50 border-b px-4 py-2 font-semibold">Valores</div>
              <div className="p-4 grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-600 font-semibold">Valor Total</div>
                  <div className="font-semibold">{total || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-600 font-semibold">Entrada</div>
                  <div className="font-semibold">{entrada || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-600 font-semibold">Pago</div>
                  <div className="font-semibold">{pago || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-600 font-semibold">Saldo</div>
                  <div className="font-semibold text-blue-700">{saldoBRL || '-'}</div>
                </div>
              </div>
            </section>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Criada em {new Date(os.createdAt).toLocaleString('pt-BR')}</div>
            <div className="text-xs text-slate-500">Use o atalho do navegador para imprimir</div>
          </div>
        </main>
      </div>
    </div>
  )
}