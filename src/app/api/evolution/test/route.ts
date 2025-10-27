export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/auth'
import { createEvolutionAPI } from '@/lib/evolution-api'

export async function POST(req: Request) {
  try {
    // Verificar autenticação
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { to, text = 'Mensagem de teste da EvolutionAPI' } = body

    if (!to) {
      return NextResponse.json({ error: 'Número de destino é obrigatório' }, { status: 400 })
    }

    // Obter configurações da EvolutionAPI
    const cfgSnap = await adminDb.collection('config').doc('geral').get()
    const cfg = (cfgSnap.data() || {}) as any
    const evolutionConfig = cfg?.evolution

    if (!evolutionConfig?.baseUrl || !evolutionConfig?.instanceName || !evolutionConfig?.token) {
      return NextResponse.json({ 
        error: 'Configuração da EvolutionAPI não encontrada. Configure em Configurações > WhatsApp Evolution.',
        configured: false
      }, { status: 500 })
    }

    // Criar instância da EvolutionAPI
    const evolutionAPI = createEvolutionAPI({
      baseUrl: evolutionConfig.baseUrl,
      instanceName: evolutionConfig.instanceName,
      token: evolutionConfig.token,
      webhook: evolutionConfig.webhook
    })

    // Executar testes de diagnóstico
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      config: {
        baseUrl: evolutionConfig.baseUrl,
        instanceName: evolutionConfig.instanceName,
        hasToken: !!evolutionConfig.token,
        hasWebhook: !!evolutionConfig.webhook
      },
      tests: {}
    }

    // Teste 1: Verificar status da instância
    try {
      const instanceStatus = await evolutionAPI.getInstanceStatus()
      diagnostics.tests.instanceStatus = {
        success: true,
        status: instanceStatus.status,
        connected: instanceStatus.status === 'open'
      }
    } catch (error: any) {
      diagnostics.tests.instanceStatus = {
        success: false,
        error: error.message
      }
    }

    // Teste 2: Verificar informações do contato
    try {
      const contactInfo = await evolutionAPI.getContactInfo(to)
      diagnostics.tests.contactInfo = {
        success: true,
        exists: contactInfo?.length > 0,
        data: contactInfo
      }
    } catch (error: any) {
      diagnostics.tests.contactInfo = {
        success: false,
        error: error.message
      }
    }

    // Teste 3: Enviar mensagem de teste (apenas se instância estiver conectada)
    if (diagnostics.tests.instanceStatus?.connected) {
      try {
        const sendResult = await evolutionAPI.sendTextMessage(to, text)
        diagnostics.tests.sendMessage = {
          success: true,
          messageId: sendResult?.key?.id,
          result: sendResult
        }
      } catch (error: any) {
        diagnostics.tests.sendMessage = {
          success: false,
          error: error.message
        }
      }
    } else {
      diagnostics.tests.sendMessage = {
        success: false,
        error: 'Instância não está conectada',
        skipped: true
      }
    }

    // Determinar status geral
    const allTestsPassed = Object.values(diagnostics.tests).every((test: any) => test.success || test.skipped)
    const criticalTestsPassed = diagnostics.tests.instanceStatus?.success

    return NextResponse.json({
      ok: allTestsPassed,
      status: criticalTestsPassed ? 'healthy' : 'unhealthy',
      to,
      diagnostics
    }, { status: 200 })

  } catch (error: any) {
    console.error('Erro no teste da EvolutionAPI:', error)
    return NextResponse.json({ 
      ok: false,
      status: 'error',
      error: error?.message || 'Falha no teste',
      details: error?.stack || String(error)
    }, { status: 500 })
  }
}

// Endpoint GET para diagnóstico rápido sem envio
export async function GET() {
  try {
    // Obter configurações da EvolutionAPI
    const cfgSnap = await adminDb.collection('config').doc('geral').get()
    const cfg = (cfgSnap.data() || {}) as any
    const evolutionConfig = cfg?.evolution

    if (!evolutionConfig?.baseUrl || !evolutionConfig?.instanceName || !evolutionConfig?.token) {
      return NextResponse.json({ 
        configured: false,
        error: 'Configuração da EvolutionAPI não encontrada'
      }, { status: 200 })
    }

    // Criar instância da EvolutionAPI
    const evolutionAPI = createEvolutionAPI({
      baseUrl: evolutionConfig.baseUrl,
      instanceName: evolutionConfig.instanceName,
      token: evolutionConfig.token,
      webhook: evolutionConfig.webhook
    })

    // Verificar apenas o status da instância
    const instanceStatus = await evolutionAPI.getInstanceStatus()
    
    return NextResponse.json({
      configured: true,
      instanceName: evolutionConfig.instanceName,
      status: instanceStatus.status,
      connected: instanceStatus.status === 'open',
      timestamp: new Date().toISOString()
    }, { status: 200 })

  } catch (error: any) {
    console.error('Erro no diagnóstico da EvolutionAPI:', error)
    return NextResponse.json({ 
      configured: true,
      error: error?.message || 'Falha no diagnóstico',
      status: 'error'
    }, { status: 500 })
  }
}