export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/auth'
import { createEvolutionAPI, type EvolutionConfig } from '@/lib/evolution-api'

export async function GET(req: Request) {
  try {
    // Verificar autenticação
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Obter configurações da EvolutionAPI
    const cfgSnap = await adminDb.collection('config').doc('geral').get()
    const cfg = (cfgSnap.data() || {}) as any
    const evolutionConfig = cfg?.evolution

    if (!evolutionConfig?.baseUrl || !evolutionConfig?.instanceName || !evolutionConfig?.token) {
      return NextResponse.json({ 
        error: 'Configuração da EvolutionAPI não encontrada',
        configured: false
      }, { status: 200 })
    }

    // Criar instância da EvolutionAPI
    const evolutionAPI = createEvolutionAPI({
      baseUrl: evolutionConfig.baseUrl,
      instanceName: evolutionConfig.instanceName,
      token: evolutionConfig.token,
      webhook: evolutionConfig.webhook
    })

    // Obter status da instância
    const status = await evolutionAPI.getInstanceStatus()
    
    // Se não estiver conectada, tentar obter QR code
    let qrCode: string | null = null
    if (status.status !== 'open') {
      qrCode = await evolutionAPI.getQRCode()
    }

    return NextResponse.json({
      configured: true,
      instanceName: evolutionConfig.instanceName,
      status: status.status,
      qrCode,
      timestamp: Date.now()
    }, { status: 200 })

  } catch (error: any) {
    console.error('Erro ao obter status da instância:', error)
    const message = error?.message || 'Falha ao obter status'
    
    return NextResponse.json({ 
      error: message,
      configured: true,
      status: 'error'
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // Verificar autenticação
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body

    // Obter configurações da EvolutionAPI
    const cfgSnap = await adminDb.collection('config').doc('geral').get()
    const cfg = (cfgSnap.data() || {}) as any
    const evolutionConfig = cfg?.evolution

    if (!evolutionConfig?.baseUrl || !evolutionConfig?.instanceName || !evolutionConfig?.token) {
      return NextResponse.json({ 
        error: 'Configuração da EvolutionAPI não encontrada' 
      }, { status: 500 })
    }

    // Criar instância da EvolutionAPI
    const evolutionAPI = createEvolutionAPI({
      baseUrl: evolutionConfig.baseUrl,
      instanceName: evolutionConfig.instanceName,
      token: evolutionConfig.token,
      webhook: evolutionConfig.webhook
    })

    let result: any

    switch (action) {
      case 'create':
        result = await evolutionAPI.createInstance()
        break

      case 'restart':
        result = await evolutionAPI.restartInstance()
        break

      case 'delete':
        result = await evolutionAPI.deleteInstance()
        break

      case 'qrcode':
        const qrCode = await evolutionAPI.getQRCode()
        result = { qrCode }
        break

      case 'status':
        result = await evolutionAPI.getInstanceStatus()
        break

      case 'logs':
        result = await evolutionAPI.getInstanceLogs()
        break

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    return NextResponse.json({ 
      ok: true,
      action,
      result
    }, { status: 200 })

  } catch (error: any) {
    console.error(`Erro na ação da instância:`, error)
    const message = error?.message || 'Falha na operação'
    
    return NextResponse.json({ 
      error: message,
      details: error?.stack || String(error)
    }, { status: 500 })
  }
}