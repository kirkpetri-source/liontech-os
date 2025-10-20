export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { verifyPassword } from '@/lib/auth'

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
      error = 'Permissão insuficiente para acessar recursos (verifique escopos do token)'
    } else if (code === 100) {
      error = 'Parâmetros inválidos enviados ao Graph (revise phoneId)'
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
    if (!allowed) return NextResponse.json({ error: 'Senha administrativa inválida' }, { status: 403 })

    const snap = await adminDb.collection('config').doc('geral').get()
    const cfg = (snap.data() || {}) as any
    const token = cfg?.whatsapp?.token || process.env.WHATSAPP_TOKEN
    const phoneId = cfg?.whatsapp?.phoneId || process.env.WHATSAPP_PHONE_ID

    const phoneIdStr = String(phoneId || '')
    const looksLikeBRPhone = /\(\d{2}\)\s?\d{4,5}-?\d{4}/.test(phoneIdStr) || /^55\d{10,11}$/.test(phoneIdStr)

    const result: any = {
      ok: false,
      checks: {
        tokenPresent: !!token,
        phoneIdPresent: !!phoneId,
        phoneIdNumeric: /^\d+$/.test(phoneIdStr),
        phoneIdNotRawPhone: !looksLikeBRPhone,
      },
      graph: undefined as any,
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

      // Fallback: alguns apps/números não expõem whatsapp_business_account neste node (v20+)
      const fieldMissing = (parsed?.message && /nonexisting field\s*\(whatsapp_business_account\)/i.test(parsed.message))
        || /nonexisting field\s*\(whatsapp_business_account\)/i.test(errText)

      if (fieldMissing) {
        const url2 = `https://graph.facebook.com/v20.0/${phoneId}?fields=id,display_phone_number,verified_name`
        const res2 = await fetch(url2, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res2.ok) {
          const json2 = await res2.json().catch(() => ({}))
          result.graph = {
            ok: true,
            phone: json2?.display_phone_number,
            verified_name: json2?.verified_name,
            waba: undefined
          }
          result.ok = true
          result.suggestions.push('Campo WABA não disponível neste node; integração validada sem WABA.')
          return NextResponse.json(result, { status: 200 })
        }
      }

      result.graph = { ok: false, error: parsed.error, code: parsed.code, message: parsed.message, details: errText }
      result.suggestions.push('Verifique onboarding do número no WhatsApp Manager e se o token pertence à mesma WABA do phoneId')
      return NextResponse.json(result, { status: 200 })
    }

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

    result.ok = true
    return NextResponse.json(result, { status: 200 })
  } catch (e) {
    console.error('POST /api/whatsapp/test error:', e)
    return NextResponse.json({ ok: false, error: 'Erro interno no teste de integração' }, { status: 500 })
  }
}