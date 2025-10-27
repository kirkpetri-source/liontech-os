export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/auth'
import { createEvolutionAPI, type EvolutionConfig } from '@/lib/evolution-api'
import crypto from 'crypto'

function toE164(brWhats: string) {
  const d = (brWhats || '').replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d
  if (d.length === 11) return '55' + d
  return null
}

export async function POST(req: Request) {
  try {
    // Verificar autenticação
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { osId, to: toOverride, mode = 'os', text, mediaUrl, fileName } = body

    // Obter configurações da EvolutionAPI
    const cfgSnap = await adminDb.collection('config').doc('geral').get()
    const cfg = (cfgSnap.data() || {}) as any
    const evolutionConfig = cfg?.evolution

    if (!evolutionConfig?.baseUrl || !evolutionConfig?.instanceName || !evolutionConfig?.token) {
      return NextResponse.json({ 
        error: 'Configuração da EvolutionAPI não encontrada. Configure em Configurações > WhatsApp Evolution.' 
      }, { status: 500 })
    }

    // Criar instância da EvolutionAPI
    const evolutionAPI = createEvolutionAPI({
      baseUrl: evolutionConfig.baseUrl,
      instanceName: evolutionConfig.instanceName,
      token: evolutionConfig.token,
      webhook: evolutionConfig.webhook
    })

    // Verificar status da instância
    const instanceStatus = await evolutionAPI.getInstanceStatus()
    if (instanceStatus.status !== 'open') {
      return NextResponse.json({ 
        error: `Instância WhatsApp não está conectada. Status: ${instanceStatus.status}`,
        status: instanceStatus.status
      }, { status: 409 })
    }

    // Determinar destinatário
    let to: string | null = null
    let os: any = null

    if (toOverride) {
      to = toE164(toOverride) || toOverride.replace(/\D/g, '') || null
    }

    if (!to && osId) {
      const snap = await adminDb.collection('ordens').doc(osId).get()
      os = snap.data()
      if (!os) {
        return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
      }
      to = toE164(os.clienteWhatsapp)
    }

    if (!to) {
      return NextResponse.json({ error: 'Destinatário inválido' }, { status: 400 })
    }

    let result: any

    switch (mode) {
      case 'text':
        if (!text) {
          return NextResponse.json({ error: 'Texto é obrigatório para modo text' }, { status: 400 })
        }
        result = await evolutionAPI.sendTextMessage(to, text)
        break

      case 'media':
        if (!mediaUrl) {
          return NextResponse.json({ error: 'URL da mídia é obrigatória para modo media' }, { status: 400 })
        }
        result = await evolutionAPI.sendMediaMessage(to, mediaUrl, text, fileName)
        break

      case 'document':
        if (!mediaUrl || !fileName) {
          return NextResponse.json({ error: 'URL e nome do arquivo são obrigatórios para modo document' }, { status: 400 })
        }
        result = await evolutionAPI.sendDocumentMessage(to, mediaUrl, fileName, text)
        break

      case 'os':
      default:
        if (!os) {
          if (!osId) {
            return NextResponse.json({ error: 'osId é obrigatório para modo os' }, { status: 400 })
          }
          const osSnap = await adminDb.collection('ordens').doc(osId).get()
          os = osSnap.data()
          if (!os) {
            return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
          }
        }

        // Gerar link seguro se configurado (considera proxies/túneis)
        const xfHost = req.headers.get('x-forwarded-host')
        const xfProto = req.headers.get('x-forwarded-proto')
        const host = xfHost || req.headers.get('host') || '127.0.0.1:3000'
        const scheme = xfProto || (host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https')
        const baseHref = `${scheme}://${host}`
        
        let osLink = ''
        const secret = evolutionConfig?.osShareSecret || cfg?.whatsapp?.osShareSecret || process.env.OS_SHARE_SECRET || process.env.ADMIN_CONFIG_PASSWORD
        if (secret && osId) {
          const shareToken = crypto.createHmac('sha256', secret).update(osId).digest('hex')
          osLink = `${baseHref}/os/${osId}?t=${shareToken}`
        }

        // Usar template personalizado se disponível
        const template = evolutionConfig?.messageTemplate || cfg?.whatsapp?.messageTemplate

        result = await evolutionAPI.sendOrderService(to, { ...os, osLink }, template)
        break
    }

    return NextResponse.json({ 
      ok: true, 
      transport: 'evolution',
      to,
      messageId: result?.key?.id || null,
      result 
    }, { status: 200 })

  } catch (error: any) {
    console.error('Erro ao enviar via EvolutionAPI:', error)
    const message = error?.message || 'Falha ao enviar mensagem'
    
    // Tratar erros específicos da EvolutionAPI
    if (message.includes('HTTP 401')) {
      return NextResponse.json({ error: 'Token da EvolutionAPI inválido' }, { status: 401 })
    }
    if (message.includes('HTTP 404')) {
      return NextResponse.json({ error: 'Instância não encontrada na EvolutionAPI' }, { status: 404 })
    }
    if (message.includes('HTTP 403')) {
      return NextResponse.json({ error: 'Acesso negado pela EvolutionAPI' }, { status: 403 })
    }

    return NextResponse.json({ 
      error: message,
      details: error?.stack || String(error)
    }, { status: 500 })
  }
}