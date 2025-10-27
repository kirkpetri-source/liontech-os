export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import puppeteer from 'puppeteer'
import * as https from 'node:https'
import crypto from 'crypto'
import { createEvolutionAPI } from '@/lib/evolution-api'

function toE164(brWhats: string) {
  const d = (brWhats || '').replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d // some numbers may have 12 or 13 digits depending on leading '9'
  if (d.length === 11) return '55' + d
  return null
}

function parseGraphError(errText: string) {
  try {
    const j = JSON.parse(errText)
    const code = j?.error?.code as number | undefined
    const message = j?.error?.message as string | undefined
    let error = 'Falha na integração com WhatsApp'
    if (message && /Unsupported post request/i.test(message)) {
      error = 'Phone ID inválido ou token sem permissão'
    }
    if (code === 133010) {
      error = 'Conta do WhatsApp não registrada no Cloud API (verifique onboarding no WhatsApp Manager)'
    } else if (code === 190) {
      error = 'Access Token inválido ou expirado'
    } else if (code === 10) {
      error = 'Permissão insuficiente para enviar mensagens (verifique escopos do token)'
    } else if (code === 100) {
      error = 'Parâmetros inválidos enviados ao Graph (revise phoneId/to)'
    } else if (code === 131030) {
      error = 'Destinatário não permitido: adicione o número em test recipients ou publique o app em modo Live'
    } else if (code === 131047) {
      error = 'Janela de 24h expirada: envie antes um template aprovado para iniciar a conversa'
    }
    return { error, code, message }
  } catch {
    const generic = /Unsupported post request/i.test(errText)
      ? 'Phone ID inválido ou token sem permissão'
      : 'Falha na integração com WhatsApp'
    return { error: generic }
  }
}

function normalizeLogoUrl(url?: string) {
  const u = (url || '').trim()
  if (!u) return ''
  if (/^(https?:\/\/|data:)/.test(u) || u.startsWith('/')) return u
  return `/uploads/logos/${u}`
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
            <header class="header">\n              <div class="brand">\n                <img src="${logoSrc}" class="logo" alt="logo" onerror="this.style.display='none'" />\n                <div class="company">\n                  <div class="company-name">${empresa.nome || 'Lion Tech'}</div>\n                  <div class="company-info">${empresa.endereco || ''}</div>\n                  <div class="company-info">${empresa.telefone || ''}${empresa.email ? ' • ' + empresa.email : ''}</div>\n                  <div class="company-info">${empresa.cnpj ? 'CNPJ: ' + empresa.cnpj : ''}</div>\n                </div>\n              </div>\n              <div class="os-meta">\n                <div class="os-title">Ordem de Serviço</div>\n                <div class="os-number">${os.numeroOS}</div>\n                <div style="margin-top:8px"><span class="chip">${os.status}</span></div>\n              </div>\n            </header>

            <main class="sections">\n              <section class="section">\n                <div class="section-h">Dados do Cliente</div>\n                <div class="rows grid2">\n                  <div>\n                    <div class="row"><div class="label">Nome</div><div class="value">${os.clienteNome}</div></div>\n                  </div>\n                  <div>\n                    <div class="row"><div class="label">WhatsApp</div><div class="value">${os.clienteWhatsapp}</div></div>\n                  </div>\n                </div>\n              </section>

              <section class="section">\n                <div class="section-h">Equipamento</div>\n                <div class="rows">\n                  <div class="row"><div class="label">Categoria</div><div class="value">${os.categoria}</div></div>\n                  <div class="row"><div class="label">Modelo</div><div class="value">${os.equipamentoModelo}</div></div>\n                  <div class="row"><div class="label">Problema</div><div class="value">${os.equipamentoProblema}</div></div>\n                  ${os.acessorios ? `<div class=\"row\"><div class=\"label\">Acessórios</div><div class=\"value\">${os.acessorios}</div></div>` : ''}
                  ${os.equipamentoSenha ? `<div class=\"row\"><div class=\"label\">Senha</div><div class=\"value\">${os.equipamentoSenha}</div></div>` : ''}
                </div>\n              </section>

              <section class="section">\n                <div class="section-h">Serviço</div>\n                <div class="rows">\n                  <div class="row"><div class="label">Previsão</div><div class="value">${previsao}</div></div>\n                  ${os.descricaoServico ? `<div class=\"row\"><div class=\"label\">Descrição</div><div class=\"value\">${os.descricaoServico}</div></div>` : ''}
                  ${os.terceirizado ? `<div class=\"row\"><div class=\"label\">Terceirizado</div><div class=\"value\">${os.servicoTerceirizado || '—'}</div></div>` : ''}
                  ${os.rastreamentoExterno ? `<div class=\"row\"><div class=\"label\">Rastreamento</div><div class=\"value\">${os.rastreamentoExterno}</div></div>` : ''}
                </div>\n              </section>

              ${(typeof os.valor === 'number' || typeof os.valorEntrada === 'number' || typeof os.valorPago === 'number') ? `\n              <section class=\"section\">\n                <div class=\"section-h\">Valores</div>\n                <div class=\"rows\">\n                  <div class=\"money\">\n                    <div><span class=\"label\">Valor Total</span><div class=\"value\">${formatMoney(os.valor)}</div></div>\n                    <div><span class=\"label\">Entrada</span><div class=\"value\">${formatMoney(os.valorEntrada)}</div></div>\n                    <div><span class=\"label\">Pago</span><div class=\"value\">${formatMoney(os.valorPago)}${os.formaPagamento ? ` (${os.formaPagamento})` : ''}</div></div>\n                    <div><span class=\"label\">Saldo</span><div class=\"value sum\">${formatMoney(saldo)}</div></div>\n                  </div>\n                </div>\n              </section>` : ''}

              <div class=\"rows\" style=\"padding-top:0\">\n                <div class=\"row\"><div class=\"label\">Criada em</div><div class=\"value\">${new Date(os.createdAt).toLocaleString('pt-BR')}</div></div>\n              </div>

              ${(imp.rodapeHabilitado || imp.rodapePersonalizado) ? `\n              <div class=\"foot\">\n                ${imp.rodapePersonalizado || 'Obrigado pela preferência. Garantia de serviços conforme condições acordadas.'}\n              </div>` : ''}

            </main>
          </div>
        </div>
      </body>
    </html>
  `
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''

    let osId: string | null = null
    let fileBlob: Blob | null = null
    let fileName: string | null = null
    let toOverride: string | null = null

    let mode: string | null = null
    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData()
      const maybeFile = fd.get('file') as File | Blob | null
      osId = (fd.get('osId') as string) || null
      toOverride = (fd.get('to') as string) || (fd.get('phone') as string) || null
      fileName = (fd.get('fileName') as string) || (typeof maybeFile === 'object' && maybeFile && (maybeFile as any).name) || 'arquivo.pdf'
      mode = (fd.get('mode') as string) || null
      if (maybeFile && typeof (maybeFile as any).arrayBuffer === 'function') {
        fileBlob = maybeFile as Blob
      }
      if (!fileBlob && !osId && mode !== 'link') {
        return NextResponse.json({ error: 'Arquivo (file) ou osId é obrigatório' }, { status: 400 })
      }
    } else {
      const body = await req.json().catch(() => ({} as any))
      osId = body?.osId || null
      toOverride = body?.phone || body?.to || null
      fileName = body?.fileName || null
      mode = body?.mode || null
      const base64 = body?.fileBase64 as string | undefined
      if (base64) {
        try {
          const buf = Buffer.from(base64, 'base64')
          if (buf.length > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'Arquivo excede 50MB' }, { status: 413 })
          }
          fileBlob = new Blob([buf], { type: body?.mimeType || 'application/pdf' })
          if (!fileName) fileName = 'arquivo.pdf'
        } catch {
          return NextResponse.json({ error: 'fileBase64 inválido' }, { status: 400 })
        }
      }
      if (!fileBlob && !osId && mode !== 'link') {
        return NextResponse.json({ error: 'osId é obrigatório quando não há arquivo' }, { status: 400 })
      }
    }

    // Carrega configuração
    const cfgSnap = await adminDb.collection('config').doc('geral').get()
    const cfg = (cfgSnap.data() || {}) as any
    const empresa = cfg.empresa || {}
    const imp = cfg.impressao || {}

    // (Credenciais Cloud serão validadas mais adiante, somente se Evolution não for usado)

    // Determina destinatário (to)
    let to: string | null = null
    if (toOverride) {
      to = toE164(toOverride) || toOverride.replace(/\D/g, '') || null
    }
    let os: any = null
    if (!to) {
      if (!osId) return NextResponse.json({ error: 'Destinatário inválido e osId ausente' }, { status: 400 })
      const snap = await adminDb.collection('ordens').doc(osId).get()
      os = snap.data()
      if (!os) return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
      to = toE164(os.clienteWhatsapp)
    }
    if (!to) return NextResponse.json({ error: 'WhatsApp do cliente inválido' }, { status: 422 })

    // Preferir EvolutionAPI para envio de O.S. quando habilitada
    // Condições: configuração Evolution ativa e válida; requisição típica de OS (sem arquivo explícito ou modo 'os')
    const evoCfg = cfg?.evolution || {}
    const evolutionEnabled = !!evoCfg?.baseUrl && !!evoCfg?.instanceName && !!evoCfg?.token && (evoCfg?.enabled !== false)
    const requestedOsFlow = !fileBlob && (mode === null || mode === undefined || mode === 'os' || mode === 'document')
    if (evolutionEnabled && requestedOsFlow) {
      try {
        const evolutionAPI = createEvolutionAPI({
          baseUrl: String(evoCfg.baseUrl),
          instanceName: String(evoCfg.instanceName),
          token: String(evoCfg.token),
          webhook: evoCfg.webhook || undefined
        })

        // Verificar status da instância
        const instanceStatus = await evolutionAPI.getInstanceStatus()
        if (instanceStatus.status === 'open') {
          // Gerar link seguro de visualização da O.S., se houver segredo
          const xfHost = req.headers.get('x-forwarded-host')
          const xfProto = req.headers.get('x-forwarded-proto')
          const host = xfHost || req.headers.get('host') || '127.0.0.1:3000'
          const scheme = xfProto || (host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https')
          const baseHref = `${scheme}://${host}`

          let osLink = ''
          const secret = evoCfg?.osShareSecret || cfg?.whatsapp?.osShareSecret || process.env.OS_SHARE_SECRET || process.env.ADMIN_CONFIG_PASSWORD
          if (secret && (osId || os?.id)) {
            const shareToken = crypto.createHmac('sha256', secret).update(osId || (os?.id || '')).digest('hex')
            osLink = `${baseHref}/os/${osId || os?.id}?t=${shareToken}`
          }

          // Usar template preferencial
          const template = evoCfg?.messageTemplate || cfg?.whatsapp?.messageTemplate

          const result = await evolutionAPI.sendOrderService(to, { ...(os || {}), osLink }, template)
          return NextResponse.json({ ok: true, transport: 'evolution', to, messageId: result?.key?.id || null, result }, { status: 200 })
        }
        // Se instância não estiver conectada, cai para Cloud
      } catch (e) {
        // Qualquer erro ao tentar Evolution fará fallback para Cloud
        console.warn('Falha ao enviar via EvolutionAPI a partir de /api/whatsapp/send. Usando Cloud API.', e)
      }
    }

    // A partir daqui, seguimos com Cloud API caso Evolution não esteja disponível ou conectado
    // Prioriza credenciais do Firestore; cai para variáveis de ambiente se ausentes
    const token = cfg?.whatsapp?.token || process.env.WHATSAPP_TOKEN
    const phoneId = cfg?.whatsapp?.phoneId || process.env.WHATSAPP_PHONE_ID
    if (!token || !phoneId) {
      return NextResponse.json({ error: 'Config WhatsApp ausente (token/phone id)' }, { status: 500 })
    }
    const phoneIdStr = String(phoneId)
    const looksLikeBRPhone = /\(\d{2}\)\s?\d{4,5}-?\d{4}/.test(phoneIdStr) || /^55\d{10,11}$/.test(phoneIdStr)
    if (!/^\d+$/.test(phoneIdStr) || looksLikeBRPhone) {
      return NextResponse.json({ error: 'Phone ID inválido. Informe o “Phone number ID” do WhatsApp Cloud (não o número do telefone).' }, { status: 400 })
    }

    // Opcional: envia mensagem de template para iniciar conversa fora da janela de 24h
    const templateName = cfg?.whatsapp?.templateName || process.env.WHATSAPP_TEMPLATE_NAME
    const templateLang = cfg?.whatsapp?.templateLang || process.env.WHATSAPP_TEMPLATE_LANG || 'pt_BR'
    if (templateName) {
      try {
        const previsao = os?.previsaoEntrega
          ? (String(os.previsaoEntrega).includes('T')
              ? new Date(os.previsaoEntrega).toLocaleString('pt-BR')
              : new Date(os.previsaoEntrega).toLocaleDateString('pt-BR'))
          : 'Não definida'

        const tplRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: {
              name: templateName,
              language: { code: templateLang },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: String(os?.numeroOS || '') },
                    { type: 'text', text: String(os?.status || '') },
                    { type: 'text', text: String(previsao || '') }
                  ]
                }
              ]
            }
          })
        })
        if (!tplRes.ok) {
          const err = await tplRes.text().catch(() => '')
          console.warn('Falha ao enviar template WhatsApp:', err)
        }
      } catch (e) {
        console.warn('Erro ao tentar enviar template WhatsApp:', e)
      }
    }

    // Modo link: envia mensagem de texto com URL de visualização segura da O.S.
    if (mode === 'link') {
      if (!os) {
        if (!osId) return NextResponse.json({ error: 'osId é obrigatório no modo link' }, { status: 400 })
        const osSnap = await adminDb.collection('ordens').doc(osId).get()
        os = osSnap.data()
        if (!os) return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
      }
      const host = req.headers.get('host') || '127.0.0.1:3000'
      const scheme = host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https'
      const baseHref = `${scheme}://${host}`
      const secret = (cfg?.whatsapp?.osShareSecret) || process.env.OS_SHARE_SECRET || process.env.ADMIN_CONFIG_PASSWORD
      if (!secret) {
        return NextResponse.json({ error: 'Segredo de link ausente. Defina em Configurações > WhatsApp ou via variável de ambiente.' }, { status: 500 })
      }
      const shareToken = crypto.createHmac('sha256', secret).update(osId || (os.id || '')).digest('hex')
      const url = `${baseHref}/os/${osId || os.id}?t=${shareToken}`
      const previsao = os?.previsaoEntrega
        ? (String(os.previsaoEntrega).includes('T')
            ? new Date(os.previsaoEntrega).toLocaleString('pt-BR')
            : new Date(os.previsaoEntrega).toLocaleDateString('pt-BR'))
        : 'Não definida'
      const tpl = String(cfg?.whatsapp?.messageTemplate || '')
      const body = tpl.trim()
        ? applyTemplate(tpl, { ...os, previsaoEntrega: previsao }, url, empresa)
        : [
            `Olá ${os.clienteNome}, aqui é da ${empresa.nome || 'Lion Tech'}.`,
            `Sua O.S. ${os.numeroOS} está com status: ${os.status}.`,
            `Previsão: ${previsao}`,
            `Veja sua O.S.: ${url}`
          ].filter(Boolean).join('\n')

      const sendRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body, preview_url: true }
        })
      })

      if (!sendRes.ok) {
        const errText = await sendRes.text()
        const parsed = parseGraphError(errText)
        const status = parsed.code === 190 ? 401
          : parsed.code === 10 ? 403
          : parsed.code === 100 ? 400
          : parsed.code === 131030 ? 403
          : parsed.code === 131047 ? 409
          : parsed.code === 133010 ? 403
          : sendRes.status >= 400 ? sendRes.status : 500
        return NextResponse.json({ error: parsed.error, code: parsed.code, message: parsed.message, details: errText }, { status })
      }

      const sent = await sendRes.json()
      return NextResponse.json({ ok: true, mode: 'link', url, message: sent }, { status: 200 })
    }

    // Define arquivo (gera PDF quando não veio arquivo)
    if (!fileBlob) {
      const host = req.headers.get('host') || '127.0.0.1:3000'
      const scheme = host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https'
      const baseHref = `${scheme}://${host}`

      const isServerless = process.env.VERCEL === '1' || process.env.DISABLE_PUPPETEER === 'true'
      if (isServerless) {
        if (!os) {
          if (!osId) return NextResponse.json({ error: 'osId é obrigatório para fallback de link' }, { status: 400 })
          const osSnap = await adminDb.collection('ordens').doc(osId).get()
          os = osSnap.data()
          if (!os) return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
        }

        const secret = (cfg?.whatsapp?.osShareSecret) || process.env.OS_SHARE_SECRET || process.env.ADMIN_CONFIG_PASSWORD
        if (!secret) {
          return NextResponse.json({ error: 'Segredo de link ausente. Defina em Configurações > WhatsApp ou via variável de ambiente.' }, { status: 500 })
        }
        const shareToken = crypto.createHmac('sha256', secret).update(osId || (os.id || '')).digest('hex')
        const url = `${baseHref}/os/${osId || os.id}?t=${shareToken}`
        const previsao = os?.previsaoEntrega
          ? (String(os.previsaoEntrega).includes('T')
              ? new Date(os.previsaoEntrega).toLocaleString('pt-BR')
              : new Date(os.previsaoEntrega).toLocaleDateString('pt-BR'))
          : 'Não definida'
        const tpl = String(cfg?.whatsapp?.messageTemplate || '')
        const body = tpl.trim()
          ? applyTemplate(tpl, { ...os, previsaoEntrega: previsao }, url, empresa)
          : [
              `Olá ${os.clienteNome}, aqui é da ${empresa.nome || 'Lion Tech'}.`,
              `Sua O.S. ${os.numeroOS} está com status: ${os.status}.`,
              `Previsão: ${previsao}`,
              `Veja sua O.S.: ${url}`
            ].filter(Boolean).join('\n')

        const sendRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { body, preview_url: true }
          })
        })

        if (!sendRes.ok) {
          const errText = await sendRes.text()
          const parsed = parseGraphError(errText)
          const status = parsed.code === 190 ? 401
            : parsed.code === 10 ? 403
            : parsed.code === 100 ? 400
            : parsed.code === 131030 ? 403
            : parsed.code === 131047 ? 409
            : parsed.code === 133010 ? 403
            : sendRes.status >= 400 ? sendRes.status : 500
          return NextResponse.json({ error: parsed.error, code: parsed.code, message: parsed.message, details: errText }, { status })
        }

        const sent = await sendRes.json()
        return NextResponse.json({ ok: true, mode: 'link', url, message: sent, serverlessFallback: true }, { status: 200 })
      }

      const html = buildHtml(os, empresa, imp, baseHref)
      const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true })
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      const pdf = await page.pdf({ format: 'A4', printBackground: true })
      await browser.close()
      fileBlob = new Blob([new Uint8Array(pdf)], { type: 'application/pdf' })
      fileName = fileName || `OS-${os.numeroOS}.pdf`
    }

    // Valida tamanho (≤50MB)
    const size = (fileBlob as any).size as number
    if (typeof size === 'number' && size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo excede 50MB' }, { status: 413 })
    }

    // Upload media
    console.log('Upload iniciado', { filename: fileName, size })
    const mediaRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      body: (() => {
        const form = new FormData()
        form.append('file', fileBlob as Blob, fileName || 'arquivo.pdf')
        form.append('type', 'application/pdf')
        form.append('messaging_product', 'whatsapp')
        return form
      })()
    })

    if (!mediaRes.ok) {
      const errText = await mediaRes.text()
      console.error('Erro upload WhatsApp media:', errText)
      const parsed = parseGraphError(errText)
      const status = parsed.code === 190 ? 401
        : parsed.code === 10 ? 403
        : parsed.code === 100 ? 400
        : parsed.code === 131030 ? 403
        : parsed.code === 131047 ? 409
        : parsed.code === 133010 ? 403
        : mediaRes.status >= 400 ? mediaRes.status : 500
      return NextResponse.json({ error: parsed.error, code: parsed.code, message: parsed.message, details: errText }, { status })
    }

    const mediaJson = await mediaRes.json()
    const mediaId = mediaJson.id
    console.log('Upload concluído', { mediaId })
    if (!mediaId) return NextResponse.json({ error: 'Upload WhatsApp media sem id' }, { status: 500 })

    // Envia documento
    const filenameToSend = fileName || (os ? `OS-${os.numeroOS}.pdf` : 'arquivo.pdf')
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: {
        id: mediaId,
        filename: filenameToSend
      }
    }

    let sendRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!sendRes.ok) {
      const errText = await sendRes.text()
      console.error('Erro ao enviar mensagem WhatsApp:', errText)
      const parsed = parseGraphError(errText)

      // Fallbacks para "messaging_product is required"
      if (parsed?.message && /messaging_product is required/i.test(parsed.message)) {
        try {
          const encoded = new TextEncoder().encode(JSON.stringify(payload))
          sendRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json; charset=UTF-8',
              Accept: 'application/json'
            },
            body: encoded as any
          })
        } catch {}
        if (sendRes?.ok) {
          const sent = await sendRes.json()
          console.log('Mensagem enviada', sent)
          return NextResponse.json({ ok: true, message: sent }, { status: 200 })
        }
      }

      if (parsed?.message && /messaging_product is required/i.test(parsed.message)) {
        try {
          sendRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages?messaging_product=whatsapp`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json; charset=UTF-8',
              Accept: 'application/json'
            },
            body: JSON.stringify(payload)
          })
        } catch {}
        if (sendRes?.ok) {
          const sent = await sendRes.json()
          console.log('Mensagem enviada', sent)
          return NextResponse.json({ ok: true, message: sent, usedQueryParam: true }, { status: 200 })
        }
      }

      if (parsed?.message && /messaging_product is required/i.test(parsed.message)) {
        try {
          const data = JSON.stringify(payload)
          const url = new URL(`https://graph.facebook.com/v20.0/${phoneId}/messages`)
          const opts: https.RequestOptions = {
            method: 'POST',
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Content-Length': Buffer.byteLength(data)
            }
          }
          const resp = await new Promise<{ status: number, body: string }>((resolve, reject) => {
            const reqHttps = https.request(opts, (res) => {
              let body = ''
              res.setEncoding('utf8')
              res.on('data', (chunk) => { body += chunk })
              res.on('end', () => resolve({ status: res.statusCode || 0, body }))
            })
            reqHttps.on('error', reject)
            reqHttps.write(data)
            reqHttps.end()
          })
          if (resp.status >= 200 && resp.status < 300) {
            const json = JSON.parse(resp.body)
            console.log('Mensagem enviada', json)
            return NextResponse.json({ ok: true, message: json, raw: true }, { status: 200 })
          }
        } catch {}
      }

      const status = parsed.code === 190 ? 401
        : parsed.code === 10 ? 403
        : parsed.code === 100 ? 400
        : parsed.code === 131030 ? 403
        : parsed.code === 131047 ? 409
        : parsed.code === 133010 ? 403
        : sendRes.status >= 400 ? sendRes.status : 500
      return NextResponse.json({ error: parsed.error, code: parsed.code, message: parsed.message, details: errText }, { status })
    }

    const sent = await sendRes.json()
    console.log('Mensagem enviada', sent)
    return NextResponse.json({ ok: true, message: sent }, { status: 200 })
  } catch (e: any) {
    console.error('Erro capturado no envio WhatsApp:', e?.response?.data || e?.message || e)
    return NextResponse.json({ error: 'Falha ao enviar WhatsApp', details: e?.message || String(e) }, { status: 500 })
  }
}