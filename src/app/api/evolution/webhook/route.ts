export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { createEvolutionAPI, type WebhookMessage } from '@/lib/evolution-api'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-signature') || ''
    
    // Obter configurações da EvolutionAPI
    const cfgSnap = await adminDb.collection('config').doc('geral').get()
    const cfg = (cfgSnap.data() || {}) as any
    const evolutionConfig = cfg?.evolution

    if (!evolutionConfig?.webhookSecret) {
      console.warn('Webhook secret não configurado, pulando validação de assinatura')
    } else {
      // Validar assinatura do webhook
      const evolutionAPI = createEvolutionAPI({
        baseUrl: evolutionConfig.baseUrl || '',
        instanceName: evolutionConfig.instanceName || '',
        token: evolutionConfig.token || ''
      })

      const isValid = evolutionAPI.validateWebhookSignature(body, signature, evolutionConfig.webhookSecret)
      if (!isValid) {
        console.error('Assinatura do webhook inválida')
        return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
      }
    }

    const webhookData: WebhookMessage = JSON.parse(body)
    
    // Log do webhook recebido
    console.log('Webhook EvolutionAPI recebido:', {
      instance: webhookData.instanceName,
      event: webhookData.data?.key?.fromMe ? 'message_sent' : 'message_received',
      from: webhookData.data?.key?.remoteJid,
      timestamp: webhookData.data?.messageTimestamp
    })

    // Processar apenas mensagens recebidas (não enviadas por nós)
    if (!webhookData.data?.key?.fromMe) {
      await processIncomingMessage(webhookData)
    }

    // Processar atualizações de status de mensagens
    if (webhookData.data?.status) {
      await processMessageStatus(webhookData)
    }

    return NextResponse.json({ ok: true }, { status: 200 })

  } catch (error: any) {
    console.error('Erro no webhook EvolutionAPI:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

async function processIncomingMessage(webhookData: WebhookMessage) {
  try {
    const messageData = webhookData.data
    const from = messageData.key.remoteJid.replace('@s.whatsapp.net', '')
    const messageId = messageData.key.id
    const timestamp = messageData.messageTimestamp
    
    // Extrair texto da mensagem
    let messageText = ''
    if (messageData.message?.conversation) {
      messageText = messageData.message.conversation
    } else if (messageData.message?.extendedTextMessage?.text) {
      messageText = messageData.message.extendedTextMessage.text
    }

    // Salvar mensagem recebida no Firestore
    const messageDoc = {
      instanceName: webhookData.instanceName,
      messageId,
      from,
      text: messageText,
      timestamp: new Date(timestamp * 1000),
      type: 'received',
      processed: false,
      rawData: messageData
    }

    await adminDb.collection('evolution_messages').add(messageDoc)

    // Verificar se é uma resposta a uma O.S.
    await checkOrderServiceResponse(from, messageText)

    console.log('Mensagem recebida processada:', { from, text: messageText })

  } catch (error) {
    console.error('Erro ao processar mensagem recebida:', error)
  }
}

async function processMessageStatus(webhookData: WebhookMessage) {
  try {
    const messageData = webhookData.data
    const messageId = messageData.key.id
    const status = messageData.status

    // Atualizar status da mensagem no Firestore
    const messagesQuery = await adminDb
      .collection('evolution_messages')
      .where('messageId', '==', messageId)
      .limit(1)
      .get()

    if (!messagesQuery.empty) {
      const messageDoc = messagesQuery.docs[0]
      await messageDoc.ref.update({
        status,
        statusUpdatedAt: new Date()
      })
    }

    console.log('Status da mensagem atualizado:', { messageId, status })

  } catch (error) {
    console.error('Erro ao processar status da mensagem:', error)
  }
}

async function checkOrderServiceResponse(from: string, messageText: string) {
  try {
    // Buscar O.S. recentes enviadas para este número
    const recentMessages = await adminDb
      .collection('evolution_messages')
      .where('to', '==', from)
      .where('type', '==', 'sent')
      .where('timestamp', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)) // últimas 24h
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get()

    if (!recentMessages.empty) {
      // Extrair número da O.S. da mensagem se possível
      const osNumberMatch = messageText.match(/(?:os|ordem|o\.s\.?)\s*#?(\d+)/i)
      if (osNumberMatch) {
        const osNumber = osNumberMatch[1]
        
        // Buscar a O.S. no sistema
        const ordersQuery = await adminDb
          .collection('ordens')
          .where('numeroOS', '==', osNumber)
          .limit(1)
          .get()

        if (!ordersQuery.empty) {
          const orderDoc = ordersQuery.docs[0]
          
          // Adicionar resposta do cliente à O.S.
          await orderDoc.ref.update({
            clienteResposta: messageText,
            clienteRespostaTimestamp: new Date(),
            ultimaInteracao: new Date()
          })

          console.log('Resposta do cliente vinculada à O.S.:', { osNumber, from })
        }
      }
    }

  } catch (error) {
    console.error('Erro ao verificar resposta da O.S.:', error)
  }
}

// Endpoint para configurar webhook na EvolutionAPI
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { webhookUrl } = body

    if (!webhookUrl) {
      return NextResponse.json({ error: 'webhookUrl é obrigatório' }, { status: 400 })
    }

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
      token: evolutionConfig.token
    })

    // Configurar webhook
    const result = await evolutionAPI.setWebhook(webhookUrl)

    return NextResponse.json({ 
      ok: true,
      webhookUrl,
      result
    }, { status: 200 })

  } catch (error: any) {
    console.error('Erro ao configurar webhook:', error)
    return NextResponse.json({ 
      error: error?.message || 'Falha ao configurar webhook'
    }, { status: 500 })
  }
}