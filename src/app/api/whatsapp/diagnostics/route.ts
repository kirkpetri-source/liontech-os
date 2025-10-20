export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { verifyPassword } from '@/lib/auth'
import * as https from 'node:https'

function toE164(brWhats: string) {
  const d = (brWhats || '').replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d
  if (d.length === 11) return '55' + d
  return null
}

function parseGraphError(errText: string) {
  try {
    const j = JSON.parse(errText)
    const code = j?.error?.code as number | undefined
    const message = j?.error?.message as string | undefined
    let error = 'Falha na integração com WhatsApp'
    if (message && /Unsupported (get|post) request/i.test(message)) {
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
    }
    return { error, code, message }
  } catch {
    const generic = /Unsupported (get|post) request/i.test(errText)
      ? 'Phone ID inválido ou token sem permissão'
      : 'Falha na integração com WhatsApp'
    return { error: generic }
  }
}

async function ensureAdminKey(req: Request) {
  try {
    const adminKeyHeader = req.headers.get('x-admin-key') || req.headers.get('X-Admin-Key')
    const snap = await adminDb.collection('config').doc('geral').get()
    const cfg = (snap.data() || {}) as any
    const storedHash: string | undefined = cfg?.seguranca?.configKeyHash
    const envKey = process.env.ADMIN_CONFIG_PASSWORD

    if (storedHash) {
      if (!adminKeyHeader) return false
      const ok = await verifyPassword(adminKeyHeader, storedHash)
      return ok
    }

    if (envKey) {
      return adminKeyHeader === envKey
    }

    // Sem proteção definida, permitido
    return true
  } catch (e) {
    console.error('ensureAdminKey error:', e)
    return false
  }
}

export async function POST(req: Request) {
  try {
    const allowed = await ensureAdminKey(req)
    if (!allowed) return NextResponse.json({ ok: false, error: 'Senha administrativa inválida' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const osId = body?.osId as string | undefined
    const toOverride = body?.to as string | undefined

    const snap = await adminDb.collection('config').doc('geral').get()
    const cfg = (snap.data() || {}) as any
    const token = cfg?.whatsapp?.token || process.env.WHATSAPP_TOKEN
    const phoneId = cfg?.whatsapp?.phoneId || process.env.WHATSAPP_PHONE_ID

    const phoneIdStr = String(phoneId || '')
    const looksLikeBRPhone = /(\(\d{2}\)\s?\d{4,5}-?\d{4})/.test(phoneIdStr) || /^55\d{10,11}$/.test(phoneIdStr)

    const result: any = {
      ok: false,
      checks: {
        tokenPresent: !!token,
        phoneIdPresent: !!phoneId,
        phoneIdNumeric: /^\d+$/.test(phoneIdStr),
        phoneIdNotRawPhone: !looksLikeBRPhone,
      },
      graph: undefined as any,
      send: undefined as any,
      suggestions: [] as string[],
    }

    if (!token || !phoneId) {
      result.suggestions.push('Configure token e phoneId em Configurações > Integração WhatsApp')
      return NextResponse.json(result, { status: 200 })
    }

    if (!/^\d+$/.test(phoneIdStr) || looksLikeBRPhone) {
      result.suggestions.push('O "Phone ID" deve ser o ID numérico do Cloud API, não o número do telefone')
      return NextResponse.json(result, { status: 200 })
    }

    // Consultar metadados do phone number no Graph para validar credenciais
    const url = `https://graph.facebook.com/v20.0/${phoneId}?fields=id,display_phone_number,verified_name,whatsapp_business_account{id,name}`
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      const parsed = parseGraphError(errText)
      result.graph = { ok: false, error: parsed.error, code: parsed.code, message: parsed.message, details: errText }
    } else {
      const json = await res.json().catch(() => ({}))
      result.graph = {
        ok: true,
        phone: json?.display_phone_number,
        verified_name: json?.verified_name,
        waba: json?.whatsapp_business_account?.id ? {
          id: json?.whatsapp_business_account?.id,
          name: json?.whatsapp_business_account?.name
        } : undefined
      }
    }

    // Determinar destino para teste de envio
    let to: string | null = null
    if (toOverride) {
      to = toE164(toOverride)
    } else if (osId) {
      const osSnap = await adminDb.collection('ordens').doc(osId).get()
      const os = osSnap.data()
      if (os) to = toE164(os?.clienteWhatsapp)
    }

    if (!to) {
      result.suggestions.push('Passe {"to":"55..."} ou {"osId":"..."} para testar envio')
      result.ok = Boolean(result.checks.tokenPresent && result.checks.phoneIdPresent && result.checks.phoneIdNumeric && result.checks.phoneIdNotRawPhone && result.graph?.ok)
      return NextResponse.json(result, { status: 200 })
    }

    // Envio mínimo: texto
    const textPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: 'Diagnóstico: teste de envio' }
    }

    let sendRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'application/json'
      },
      body: JSON.stringify(textPayload)
    })

    let send: any = { transport: 'fetch', status: sendRes.status, ok: sendRes.ok, body: '', parsed: undefined }
    try {
      const bodyText = await sendRes.text()
      send.body = bodyText
      try { send.parsed = JSON.parse(bodyText) } catch {}
    } catch {}

    if (!sendRes.ok) {
      // Fallback via node:https com Content-Length explícito
      try {
        const data = JSON.stringify(textPayload)
        const u = new URL(`https://graph.facebook.com/v20.0/${phoneId}/messages`)
        const opts: https.RequestOptions = {
          method: 'POST',
          hostname: u.hostname,
          path: u.pathname + u.search,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Content-Length': Buffer.byteLength(data)
          }
        }
        const resp = await new Promise<{ status: number, body: string }>((resolve, reject) => {
          const reqHttps = https.request(opts, (r) => {
            let b = ''
            r.setEncoding('utf8')
            r.on('data', (c) => { b += c })
            r.on('end', () => resolve({ status: r.statusCode || 0, body: b }))
          })
          reqHttps.on('error', reject)
          reqHttps.write(data)
          reqHttps.end()
        })
        send = { transport: 'https', status: resp.status, ok: resp.status >= 200 && resp.status < 300, body: resp.body }
        try { send.parsed = JSON.parse(resp.body) } catch {}
      } catch (e) {
        send = { transport: 'https', status: 0, ok: false, body: String(e || '') }
      }
    }

    result.send = send
    result.ok = Boolean(result.graph?.ok) && Boolean(send?.ok)
    if (!send?.ok) {
      const parsed = parseGraphError(String(send?.body || ''))
      result.suggestions.push('Se o envio falhar com "(#100) messaging_product", gere token permanente no App/WABA do phoneId e garanta escopos WhatsApp.')
      result.suggestions.push('Se estiver em modo Desenvolvimento, adicione o número destino em test recipients do App.')
      return NextResponse.json(result, { status: 200 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (e) {
    console.error('POST /api/whatsapp/diagnostics error:', e)
    return NextResponse.json({ ok: false, error: 'Erro interno na rota de diagnóstico' }, { status: 500 })
  }
}