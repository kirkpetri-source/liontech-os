export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { ensureClient, sendText, sendPdf, getState, resetClient } from '@/lib/whatsapp-web'
import crypto from 'crypto'
// import puppeteer from 'puppeteer'

function toE164(brWhats: string) {
  const d = (brWhats || '').replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d
  if (d.length === 11) return '55' + d
  return null
}

function normalizeLogoUrl(url?: string) {
  const u = (url || '').trim()
  if (!u) return ''
  if (/^(https?:\/\/|data:)/.test(u) || u.startsWith('/')) return u
  return `/uploads/logos/${u}`
}

function buildHtml(os: any, empresa: any, imp: any, baseHref: string) {
  const moeda = 'R$'
  const statusColor = os.status === 'Concluído' ? '#16a34a' : os.status === 'Em Andamento' ? '#2563eb' : os.status === 'Entregue' ? '#10b981' : '#f59e0b'
  const formatMoney = (v?: number) => typeof v === 'number' ? `${moeda} ${v.toFixed(2)}` : '-'
  const previsao = os.previsaoEntrega
    ? (String(os.previsaoEntrega).includes('T')
        ? new Date(os.previsaoEntrega).toLocaleString('pt-BR')
        : new Date(os.previsaoEntrega).toLocaleDateString('pt-BR'))
    : 'Não definida'
  const saldo = (os.valor || 0) - (os.valorPago || 0) - (os.valorEntrada || 0)
  const logoSrc = normalizeLogoUrl(imp.logoUrl) || '/logo.svg'
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Ordem de Serviço ${os.numeroOS}</title>
        <base href="${baseHref}">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
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
        <div class="page">
          <div class="doc">
            <header class="header">
              <div class="brand">
                <img src="${logoSrc}" class="logo" alt="logo" onerror="this.style.display='none'" />
                <div class="company">
                  <div class="company-name">${empresa.nome || 'Lion Tech'}</div>
                  <div class="company-info">${empresa.endereco || ''}</div>
                  <div class="company-info">${empresa.telefone || ''}${empresa.email ? ' • ' + empresa.email : ''}</div>
                  <div class="company-info">${empresa.cnpj ? 'CNPJ: ' + empresa.cnpj : ''}</div>
                </div>
              </div>
              <div class="os-meta">
                <div class="os-title">Ordem de Serviço</div>
                <div class="os-number">${os.numeroOS}</div>
                <div style="margin-top:8px"><span class="chip">${os.status}</span></div>
              </div>
            </header>
            <main class="sections">
              <section class="section">
                <div class="section-h">Dados do Cliente</div>
                <div class="rows grid2">
                  <div>
                    <div class="row"><div class="label">Nome</div><div class="value">${os.clienteNome}</div></div>
                  </div>
                  <div>
                    <div class="row"><div class="label">WhatsApp</div><div class="value">${os.clienteWhatsapp}</div></div>
                  </div>
                </div>
              </section>
              <section class="section">
                <div class="section-h">Equipamento</div>
                <div class="rows">
                  <div class="row"><div class="label">Categoria</div><div class="value">${os.categoria}</div></div>
                  <div class="row"><div class="label">Modelo</div><div class="value">${os.equipamentoModelo}</div></div>
                  <div class="row"><div class="label">Problema</div><div class="value">${os.equipamentoProblema}</div></div>
                  ${os.acessorios ? `<div class="row"><div class="label">Acessórios</div><div class="value">${os.acessorios}</div></div>` : ''}
                  ${os.equipamentoSenha ? `<div class="row"><div class="label">Senha</div><div class="value">${os.equipamentoSenha}</div></div>` : ''}
                </div>
              </section>
              <section class="section">
                <div class="section-h">Serviço</div>
                <div class="rows">
                  <div class="row"><div class="label">Previsão</div><div class="value">${previsao}</div></div>
                  ${os.descricaoServico ? `<div class="row"><div class="label">Descrição</div><div class="value">${os.descricaoServico}</div></div>` : ''}
                  ${os.terceirizado ? `<div class="row"><div class="label">Terceirizado</div><div class="value">${os.servicoTerceirizado || '—'}</div></div>` : ''}
                  ${os.rastreamentoExterno ? `<div class="row"><div class="label">Rastreamento</div><div class="value">${os.rastreamentoExterno}</div></div>` : ''}
                </div>
              </section>
              ${(typeof os.valor === 'number' || typeof os.valorEntrada === 'number' || typeof os.valorPago === 'number') ? `
              <section class="section">
                <div class="section-h">Valores</div>
                <div class="rows">
                  <div class="money">
                    <div><span class="label">Valor Total</span><div class="value">${formatMoney(os.valor)}</div></div>
                    <div><span class="label">Entrada</span><div class="value">${formatMoney(os.valorEntrada)}</div></div>
                    <div><span class="label">Pago</span><div class="value">${formatMoney(os.valorPago)}${os.formaPagamento ? ` (${os.formaPagamento})` : ''}</div></div>
                    <div><span class="label">Saldo</span><div class="value sum">${formatMoney(saldo)}</div></div>
                  </div>
                </div>
              </section>` : ''}
              <div class="rows" style="padding-top:0">
                <div class="row"><div class="label">Criada em</div><div class="value">${new Date(os.createdAt).toLocaleString('pt-BR')}</div></div>
              </div>
              ${(imp.rodapeHabilitado || imp.rodapePersonalizado) ? `
              <div class="foot">
                ${imp.rodapePersonalizado || 'Obrigado pela preferência. Garantia de serviços conforme condições acordadas.'}
              </div>` : ''}
            </main>
          </div>
        </div>
      </body>
    </html>
  `
}

function formatMoneyBR(v: any, currency: string = 'BRL') {
  if (v === undefined || v === null || v === '' || isNaN(Number(v))) return ''
  try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(Number(v)) } catch { return String(v) }
}

function applyTemplate(tpl: string, os: any, url: string, empresa: any) {
  const currency = (empresa?.moedaPadrao || 'BRL')
  const previsao = os?.previsaoEntrega
    ? (String(os.previsaoEntrega).includes('T')
        ? new Date(os.previsaoEntrega).toLocaleString('pt-BR')
        : new Date(os.previsaoEntrega).toLocaleDateString('pt-BR'))
    : ''
  const map: Record<string, string> = {
    clienteNome: os?.clienteNome || '',
    numeroOS: os?.numeroOS || '',
    status: os?.status || '',
    equipamentoModelo: os?.equipamentoModelo || '',
    equipamentoProblema: os?.equipamentoProblema || '',
    previsaoEntrega: previsao,
    categoria: os?.categoria || '',
    descricaoServico: os?.descricaoServico || '',
    valor: formatMoneyBR(os?.valor, currency),
    valorEntrada: formatMoneyBR(os?.valorEntrada, currency),
    valorPago: formatMoneyBR(os?.valorPago, currency),
    formaPagamento: os?.formaPagamento || '',
    rastreamentoExterno: os?.rastreamentoExterno || '',
    osLink: url || '',
  }
  let body = tpl || ''
  for (const [k, v] of Object.entries(map)) {
    body = body.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v ?? ''))
  }
  return body.trim()
}

export async function POST(req: Request) {
  try {
    // Bloquear em ambientes serverless (ex.: Vercel), que não suportam WhatsApp Web + Chromium
    if (process.env.VERCEL === '1' || process.env.DISABLE_WHATSAPP_WEB === 'true') {
      const res = NextResponse.json({ error: 'WhatsApp Web não é suportado neste ambiente. Use deploy Docker + servidor.' }, { status: 503 })
      res.headers.set('Access-Control-Allow-Origin', '*')
      res.headers.set('Access-Control-Allow-Headers', '*')
      return res
    }

    await ensureClient()

    const { osId, to: toRaw, mode } = await req.json()
    if (!osId && !toRaw) return NextResponse.json({ error: 'Informe osId ou to' }, { status: 400 })

    // Garantir que o cliente está pronto antes de enviar (aguarda até 5s)
    let st = getState()
    if (st.status !== 'ready' && st.status !== 'authenticated') {
      const started = Date.now()
      while (Date.now() - started < 5000) {
        await new Promise((r) => setTimeout(r, 250))
        st = getState()
        if (st.status === 'ready' || st.status === 'authenticated') break
      }
    }
    if (st.status !== 'ready' && st.status !== 'authenticated') {
      const resErr = NextResponse.json({ error: 'Cliente WhatsApp Web não está pronto', state: st.status }, { status: 409 })
      resErr.headers.set('Access-Control-Allow-Origin', '*')
      resErr.headers.set('Access-Control-Allow-Headers', '*')
      return resErr
    }

    let to: string | null = null
    let os: any | null = null

    if (osId) {
      const snap = await adminDb.collection('ordens').doc(osId).get()
      os = snap.data()
      if (!os) return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
      to = toE164(os.clienteWhatsapp)
    } else if (toRaw) {
      to = toE164(String(toRaw))
    }

    if (!to) return NextResponse.json({ error: 'WhatsApp destino inválido' }, { status: 422 })

    const host = req.headers.get('host') || '127.0.0.1:3000'
    const scheme = host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https'
    const baseHref = `${scheme}://${host}`

    if ((mode === 'text' || mode === 'link') && os) {
      const cfgSnap = await adminDb.collection('config').doc('geral').get()
      const cfg = (cfgSnap.data() || {}) as any
      const empresaNome = (cfg?.empresa?.nome || 'Lion Tech')
      const tpl = String(cfg?.whatsapp?.messageTemplate || '')
      const wantsUrl = mode === 'link' || tpl.includes('{{osLink}}')
      let url = ''
      let hasUrl = false
      if (wantsUrl) {
        const secret = (cfg?.whatsapp?.osShareSecret) || process.env.OS_SHARE_SECRET || process.env.ADMIN_CONFIG_PASSWORD
        if (secret) {
          const token = crypto.createHmac('sha256', secret).update(osId || (os.id || '')).digest('hex')
          url = `${baseHref}/os/${osId || os.id}?t=${token}`
          hasUrl = true
        } else {
          // Sem segredo: degrade para texto simples, omitindo o link
          url = ''
          hasUrl = false
        }
      }
      const previsao = os?.previsaoEntrega
        ? (String(os.previsaoEntrega).includes('T')
            ? new Date(os.previsaoEntrega).toLocaleString('pt-BR')
            : new Date(os.previsaoEntrega).toLocaleDateString('pt-BR'))
        : 'Não definida'
      const body = tpl.trim()
        ? applyTemplate(tpl, { ...os, previsaoEntrega: previsao }, url, cfg?.empresa || {})
        : [
            `Olá ${os.clienteNome}!`,
            `Sua O.S. ${os.numeroOS} está com status: ${os.status}.`,
            `Previsão: ${previsao}`,
            ...(hasUrl ? [`Acompanhe detalhes e atualizações no link: ${url}`] : []),
            `— Equipe ${empresaNome}`
          ].join('\n')
      const sent = await sendText(to, body)
      const res = NextResponse.json({ ok: true, transport: 'web', to, messageId: sent?.id || null, mode: hasUrl ? 'link' : 'text', url }, { status: 200 })
      res.headers.set('Access-Control-Allow-Origin', '*')
      res.headers.set('Access-Control-Allow-Headers', '*')
      return res
    }
    if (mode === 'text' || !os) {
      const body = os ? `O.S. ${os.numeroOS} (${os.status})` : 'Mensagem de teste via WhatsApp Web'
      const sent = await sendText(to, body)
      const res = NextResponse.json({ ok: true, transport: 'web', to, messageId: sent.id || null }, { status: 200 })
      res.headers.set('Access-Control-Allow-Origin', '*')
      res.headers.set('Access-Control-Allow-Headers', '*')
      return res
    }

    // Gerar PDF e enviar como documento
    const html = buildHtml(os, (await adminDb.collection('config').doc('geral').get()).data()?.empresa || {}, (await adminDb.collection('config').doc('geral').get()).data()?.impressao || {}, baseHref)

    // Garantir que ws use fallback JS e Puppeteer resolva o executável
    process.env.WS_NO_BUFFER_UTIL = '1'
    process.env.WS_NO_UTF_8_VALIDATE = '1'

    // Resolve Puppeteer com fallback para puppeteer-core e ESM default
    let puppeteerDyn: any
    try {
      const mod = await import('puppeteer')
      puppeteerDyn = (mod as any).default || mod
    } catch (e) {
      const modCore = await import('puppeteer-core')
      puppeteerDyn = (modCore as any).default || modCore
    }
    if (!puppeteerDyn?.launch) {
      try {
        const modCore = await import('puppeteer-core')
        puppeteerDyn = (modCore as any).default || modCore
      } catch {}
    }

    const envExec = process.env.PUPPETEER_EXECUTABLE_PATH
    const execPath = envExec || (typeof puppeteerDyn.executablePath === 'function' ? puppeteerDyn.executablePath() : undefined)

    const browser = await puppeteerDyn.launch({ args: ['--no-sandbox'], headless: true, executablePath: execPath })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    const caption = `Ordem de Serviço #${os.numeroOS} (${os.status})`
    try {
      await sendText(to, caption)
    } catch {}
    const safeName = `OS-${String(os.numeroOS || '').replace(/[^A-Za-z0-9_-]/g, '') || 'arquivo'}.pdf`
    const resp = await sendPdf(to, Buffer.from(pdf), safeName, undefined)
    const res = NextResponse.json({ ok: true, transport: 'web', to, messageId: resp?.id || null }, { status: 200 })
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Headers', '*')
    return res
  } catch (e: any) {
    console.error('POST /api/whatsapp-web/send error:', e)
    const raw = e && typeof e !== 'object' ? String(e) : undefined
    const msg = typeof e?.message === 'string' ? e.message : (raw || 'Falha ao enviar via WhatsApp Web')
    const st = getState()?.status
    const isInvalidNumber = /n[úu]mero.*(não|nao).*whatsapp|inválido|invalido/i.test(msg)
    const isEvalFailed = /Evaluation failed/i.test(msg) || /Evaluation failed/i.test(String(e || ''))
    const isTargetClosed = /Target closed/i.test(msg) || /Protocol error.*Target closed/i.test(String(e || ''))
    const isNullEvaluate = /Cannot read (property|properties) of null.*evaluate/i.test(msg) || /Cannot read (property|properties) of null.*evaluate/i.test(String(e || ''))
    const status = isInvalidNumber ? 422 : (isEvalFailed || isTargetClosed || isNullEvaluate) ? 409 : 500
    if (isTargetClosed || isNullEvaluate) {
      try { await resetClient('send route auto-recover'); ensureClient().catch(() => null) } catch {}
    }
    console.error('POST /api/whatsapp-web/send computed', { state: st, msg, status })
    const resErr = NextResponse.json({ error: msg, state: st }, { status })
    resErr.headers.set('Access-Control-Allow-Origin', '*')
    resErr.headers.set('Access-Control-Allow-Headers', '*')
    return resErr
  }
}