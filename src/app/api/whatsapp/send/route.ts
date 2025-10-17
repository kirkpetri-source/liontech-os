export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import puppeteer from 'puppeteer'

function toE164(brWhats: string) {
  const d = (brWhats || '').replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d // some numbers may have 12 or 13 digits depending on leading '9'
  if (d.length === 11) return '55' + d
  return null
}

function buildHtml(os: any, empresa: any, imp: any) {
  const moeda = 'R$'
  const statusColor = os.status === 'Concluído' ? '#16a34a' : os.status === 'Em Andamento' ? '#2563eb' : os.status === 'Entregue' ? '#10b981' : '#f59e0b'
  const formatMoney = (v?: number) => typeof v === 'number' ? `${moeda} ${v.toFixed(2)}` : '-'
  const previsao = os.previsaoEntrega
    ? (String(os.previsaoEntrega).includes('T')
        ? new Date(os.previsaoEntrega).toLocaleString('pt-BR')
        : new Date(os.previsaoEntrega).toLocaleDateString('pt-BR'))
    : 'Não definida'
  const saldo = (os.valor || 0) - (os.valorPago || 0) - (os.valorEntrada || 0)

  return `
    <html>
      <head>
        <meta charset=\"utf-8\" />
        <title>Ordem de Serviço ${os.numeroOS}</title>
        <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap\" rel=\"stylesheet\" />
        <style>
          :root { --ink:#0f172a; --muted:#64748b; --accent:#1d4ed8; --line:#e2e8f0; }
          * { box-sizing: border-box; }
          body { font-family: 'Inter', system-ui, -apple-system, Segoe UI, Arial, sans-serif; color: var(--ink); margin: 0; }
          .page { padding: 18mm; }
          .doc { max-width: 210mm; margin: 0 auto; background: white; }
          .header { display: ${imp.cabecalhoOrdens !== false ? 'grid' : 'none'}; grid-template-columns: 1fr auto; gap: 16px; align-items: center; padding-bottom: 12px; border-bottom: 2px solid var(--ink); }
          .brand { display:flex; align-items:center; gap:14px; }
          .logo { width: 96px; height: 96px; object-fit: contain; flex: 0 0 auto; }
          .company { line-height: 1.25; }
          .company-name { font-size: 22px; font-weight: 700; letter-spacing: .2px; }
          .company-info { font-size: 12px; color: var(--muted); margin-top: 2px; }
          .os-meta { text-align: right; }
          .os-title { font-size: 13px; color: var(--muted); margin-bottom: 4px; }
          .os-number { font-size: 22px; font-weight: 700; color: var(--accent); }
          .chip { display:inline-block; padding: 4px 10px; border-radius: 999px; color: white; font-size: 12px; font-weight: 600; background: ${statusColor}; }
          .sections { margin-top: 16px; display: grid; gap: 12px; }
          .section { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
          .section-h { padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid var(--line); font-weight: 700; font-size: 13px; letter-spacing: .2px; }
          .rows { padding: 12px; display: grid; gap: 6px; }
          .row { display: grid; grid-template-columns: max-content 1fr; align-items: baseline; gap: 6px; font-size: 13px; }
          .label { color: var(--muted); font-weight: 600; white-space: nowrap; }
          .value { color: var(--ink); font-weight: 600; }
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .money { background: #f8fafc; border: 1px dashed var(--line); border-radius: 8px; padding: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; }
          .sum { font-weight: 700; color: var(--accent); }
          .foot { margin-top: 16px; padding-top: 10px; border-top: 1px solid var(--line); color: var(--muted); font-size: 11px; }
        </style>
      </head>
      <body>
        <div class=\"page\">
          <div class=\"doc\">
            <header class=\"header\">
              <div class=\"brand\">
                <img src=\"${imp.logoUrl || '/logo.svg'}\" class=\"logo\" alt=\"logo\" onerror=\"this.style.display='none'\" />
                <div class=\"company\">
                  <div class=\"company-name\">${empresa.nome || 'Lion Tech'}</div>
                  <div class=\"company-info\">${empresa.endereco || ''}</div>
                  <div class=\"company-info\">${empresa.telefone || ''}${empresa.email ? ' • ' + empresa.email : ''}</div>
                  <div class=\"company-info\">${empresa.cnpj ? 'CNPJ: ' + empresa.cnpj : ''}</div>
                </div>
              </div>
              <div class=\"os-meta\">
                <div class=\"os-title\">Ordem de Serviço</div>
                <div class=\"os-number\">${os.numeroOS}</div>
                <div style=\"margin-top:8px\"><span class=\"chip\">${os.status}</span></div>
              </div>
            </header>

            <main class=\"sections\">
              <section class=\"section\">
                <div class=\"section-h\">Dados do Cliente</div>
                <div class=\"rows grid2\">
                  <div>
                    <div class=\"row\"><div class=\"label\">Nome</div><div class=\"value\">${os.clienteNome}</div></div>
                  </div>
                  <div>
                    <div class=\"row\"><div class=\"label\">WhatsApp</div><div class=\"value\">${os.clienteWhatsapp}</div></div>
                  </div>
                </div>
              </section>

              <section class=\"section\">
                <div class=\"section-h\">Equipamento</div>
                <div class=\"rows\">
                  <div class=\"row\"><div class=\"label\">Categoria</div><div class=\"value\">${os.categoria}</div></div>
                  <div class=\"row\"><div class=\"label\">Modelo</div><div class=\"value\">${os.equipamentoModelo}</div></div>
                  <div class=\"row\"><div class=\"label\">Problema</div><div class=\"value\">${os.equipamentoProblema}</div></div>
                  ${os.acessorios ? `<div class=\"row\"><div class=\"label\">Acessórios</div><div class=\"value\">${os.acessorios}</div></div>` : ''}
                  ${os.equipamentoSenha ? `<div class=\"row\"><div class=\"label\">Senha</div><div class=\"value\">${os.equipamentoSenha}</div></div>` : ''}
                </div>
              </section>

              <section class=\"section\">
                <div class=\"section-h\">Serviço</div>
                <div class=\"rows\">
                  <div class=\"row\"><div class=\"label\">Previsão</div><div class=\"value\">${previsao}</div></div>
                  ${os.descricaoServico ? `<div class=\"row\"><div class=\"label\">Descrição</div><div class=\"value\">${os.descricaoServico}</div></div>` : ''}
                  ${os.terceirizado ? `<div class=\"row\"><div class=\"label\">Terceirizado</div><div class=\"value\">${os.servicoTerceirizado || '—'}</div></div>` : ''}
                  ${os.rastreamentoExterno ? `<div class=\"row\"><div class=\"label\">Rastreamento</div><div class=\"value\">${os.rastreamentoExterno}</div></div>` : ''}
                </div>
              </section>

              ${(typeof os.valor === 'number' || typeof os.valorEntrada === 'number' || typeof os.valorPago === 'number') ? `
              <section class=\"section\">
                <div class=\"section-h\">Valores</div>
                <div class=\"rows\">
                  <div class=\"money\">
                    <div><span class=\"label\">Valor Total</span><div class=\"value\">${formatMoney(os.valor)}</div></div>
                    <div><span class=\"label\">Entrada</span><div class=\"value\">${formatMoney(os.valorEntrada)}</div></div>
                    <div><span class=\"label\">Pago</span><div class=\"value\">${formatMoney(os.valorPago)}${os.formaPagamento ? ` (${os.formaPagamento})` : ''}</div></div>
                    <div><span class=\"label\">Saldo</span><div class=\"value sum\">${formatMoney(saldo)}</div></div>
                  </div>
                </div>
              </section>` : ''}

              <div class=\"rows\" style=\"padding-top:0\">
                <div class=\"row\"><div class=\"label\">Criada em</div><div class=\"value\">${new Date(os.createdAt).toLocaleString('pt-BR')}</div></div>
              </div>

              ${(imp.rodapeHabilitado || imp.rodapePersonalizado) ? `
              <div class=\"foot\">
                ${imp.rodapePersonalizado || 'Obrigado pela preferência. Garantia de serviços conforme condições acordadas.'}
              </div>` : ''}

            </main>
          </div>
        </div>
      </body>
    </html>
  `
}

export async function POST(req: Request) {
  try {
    const { osId } = await req.json()
    if (!osId) return NextResponse.json({ error: 'osId é obrigatório' }, { status: 400 })

    const snap = await adminDb.collection('ordens').doc(osId).get()
    const os = snap.data()
    if (!os) return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })

    const cfgSnap = await adminDb.collection('config').doc('geral').get()
    const cfg = (cfgSnap.data() || {}) as any
    const empresa = cfg.empresa || {}
    const imp = cfg.impressao || {}

    const to = toE164(os.clienteWhatsapp)
    if (!to) return NextResponse.json({ error: 'WhatsApp do cliente inválido' }, { status: 422 })

    const token = process.env.WHATSAPP_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_ID
    if (!token || !phoneId) {
      return NextResponse.json({ error: 'Config WhatsApp ausente (token/phone id)' }, { status: 500 })
    }

    // Gera PDF
    const html = buildHtml(os, empresa, imp)
    const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    // Upload media
    const mediaRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: (() => {
        const form = new FormData()
        const body = new Uint8Array(pdf)
        form.append('file', new Blob([body], { type: 'application/pdf' }), `OS-${os.numeroOS}.pdf`)
        form.append('type', 'application/pdf')
        return form
      })()
    })

    if (!mediaRes.ok) {
      const err = await mediaRes.text()
      return NextResponse.json({ error: 'Falha ao enviar mídia', details: err }, { status: 500 })
    }
    const mediaJson = await mediaRes.json()
    const mediaId = mediaJson.id

    // Send message
    const msgRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: {
          id: mediaId,
          filename: `OS-${os.numeroOS}.pdf`
        }
      })
    })

    if (!msgRes.ok) {
      const err = await msgRes.text()
      return NextResponse.json({ error: 'Falha ao enviar mensagem', details: err }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro ao enviar O.S via WhatsApp:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}