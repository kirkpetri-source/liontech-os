import crypto from 'crypto'

export type EvolutionConfig = {
  baseUrl: string
  instanceName: string
  token: string
  webhook?: string
}

export type MessageType = 'text' | 'image' | 'document' | 'audio' | 'video'

export type SendMessagePayload = {
  number: string
  text?: string
  mediaUrl?: string
  fileName?: string
  caption?: string
  type: MessageType
}

export type InstanceStatus = {
  instance: string
  status: 'open' | 'close' | 'connecting'
  qrcode?: string
}

export type MessageStatus = {
  messageId: string
  status: 'pending' | 'sent' | 'received' | 'read' | 'failed'
  timestamp: number
}

export type WebhookMessage = {
  instanceName: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    message: any
    messageTimestamp: number
    status?: string
  }
}

export class EvolutionAPI {
  private config: EvolutionConfig
  private retryCount = 3
  private retryDelay = 1000

  constructor(config: EvolutionConfig) {
    this.config = config
    this.validateConfig()
  }

  private validateConfig() {
    if (!this.config.baseUrl) throw new Error('baseUrl é obrigatório')
    if (!this.config.instanceName) throw new Error('instanceName é obrigatório')
    if (!this.config.token) throw new Error('token é obrigatório')
    
    // Normalizar baseUrl
    this.config.baseUrl = this.config.baseUrl.replace(/\/$/, '')
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.config.token,
      'Accept': 'application/json'
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: this.getHeaders(),
          body: body ? JSON.stringify(body) : undefined,
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        return await response.json()
      } catch (error) {
        console.error(`Tentativa ${attempt} falhou:`, error)
        
        if (attempt === this.retryCount) {
          throw new Error(`Falha após ${this.retryCount} tentativas: ${error}`)
        }
        
        await this.delay(this.retryDelay * attempt)
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private formatPhoneNumber(number: string): string {
    // Remove todos os caracteres não numéricos
    const cleaned = number.replace(/\D/g, '')
    
    // Se começar com 55 e tiver 12-13 dígitos, já está no formato correto
    if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
      return cleaned
    }
    
    // Se tiver 11 dígitos, adiciona o código do país (55)
    if (cleaned.length === 11) {
      return `55${cleaned}`
    }
    
    // Se tiver 10 dígitos, adiciona 9 e código do país
    if (cleaned.length === 10) {
      return `55${cleaned.substring(0, 2)}9${cleaned.substring(2)}`
    }
    
    return cleaned
  }

  // Gerenciamento de instância
  async createInstance(): Promise<any> {
    return this.makeRequest(`/instance/create`, 'POST', {
      instanceName: this.config.instanceName,
      token: this.config.token,
      qrcode: true,
      webhook: this.config.webhook
    })
  }

  async getInstanceStatus(): Promise<InstanceStatus> {
    const response = await this.makeRequest(`/instance/connectionState/${this.config.instanceName}`)
    return {
      instance: this.config.instanceName,
      status: response.instance?.state || 'close'
    }
  }

  async getQRCode(): Promise<string | null> {
    try {
      const response = await this.makeRequest(`/instance/qrcode/${this.config.instanceName}`)
      return response.qrcode || null
    } catch (error) {
      console.error('Erro ao obter QR Code:', error)
      return null
    }
  }

  async deleteInstance(): Promise<any> {
    return this.makeRequest(`/instance/delete/${this.config.instanceName}`, 'DELETE')
  }

  async restartInstance(): Promise<any> {
    return this.makeRequest(`/instance/restart/${this.config.instanceName}`, 'PUT')
  }

  // Envio de mensagens
  async sendTextMessage(number: string, text: string): Promise<any> {
    const formattedNumber = this.formatPhoneNumber(number)
    
    return this.makeRequest(`/message/sendText/${this.config.instanceName}`, 'POST', {
      number: formattedNumber,
      text: text
    })
  }

  async sendMediaMessage(number: string, mediaUrl: string, caption?: string, fileName?: string): Promise<any> {
    const formattedNumber = this.formatPhoneNumber(number)
    
    return this.makeRequest(`/message/sendMedia/${this.config.instanceName}`, 'POST', {
      number: formattedNumber,
      mediaMessage: {
        media: mediaUrl,
        caption: caption || '',
        fileName: fileName
      }
    })
  }

  async sendDocumentMessage(number: string, documentUrl: string, fileName: string, caption?: string): Promise<any> {
    const formattedNumber = this.formatPhoneNumber(number)
    
    return this.makeRequest(`/message/sendMedia/${this.config.instanceName}`, 'POST', {
      number: formattedNumber,
      mediaMessage: {
        media: documentUrl,
        fileName: fileName,
        caption: caption || ''
      }
    })
  }

  // Informações de contato
  async getContactInfo(number: string): Promise<any> {
    const formattedNumber = this.formatPhoneNumber(number)
    return this.makeRequest(`/chat/whatsappNumbers/${this.config.instanceName}`, 'POST', {
      numbers: [formattedNumber]
    })
  }

  // Webhook e eventos
  async setWebhook(webhookUrl: string): Promise<any> {
    return this.makeRequest(`/webhook/set/${this.config.instanceName}`, 'POST', {
      webhook: {
        url: webhookUrl,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'SEND_MESSAGE',
          'CONNECTION_UPDATE'
        ]
      }
    })
  }

  // Utilitários
  generateWebhookSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }

  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateWebhookSignature(payload, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }

  // Logs e monitoramento
  async getInstanceLogs(): Promise<any> {
    return this.makeRequest(`/instance/fetchInstances`)
  }

  // Método para enviar O.S. formatada
  async sendOrderService(number: string, orderData: any, template?: string): Promise<any> {
    const formattedNumber = this.formatPhoneNumber(number)
    
    // Template padrão para O.S.
    const defaultTemplate = `
🔧 *Ordem de Serviço #{{numeroOS}}*

👤 *Cliente:* {{clienteNome}}
📱 *WhatsApp:* {{clienteWhatsapp}}

🖥️ *Equipamento:*
• Categoria: {{categoria}}
• Modelo: {{equipamentoModelo}}
• Problema: {{equipamentoProblema}}

📋 *Status:* {{status}}
📅 *Previsão:* {{previsaoEntrega}}

💰 *Valores:*
• Total: {{valor}}
• Entrada: {{valorEntrada}}
• Pago: {{valorPago}}
• Saldo: {{saldo}}

{{#osLink}}
🔗 Acompanhe sua O.S.:
{{osLink}}
{{/osLink}}

---
Obrigado pela preferência! 🙏
    `.trim()

    const messageTemplate = template || defaultTemplate
    let message = messageTemplate

    // Substituir variáveis do template
    const variables = {
      numeroOS: orderData.numeroOS || '',
      clienteNome: orderData.clienteNome || '',
      clienteWhatsapp: orderData.clienteWhatsapp || '',
      categoria: orderData.categoria || '',
      equipamentoModelo: orderData.equipamentoModelo || '',
      equipamentoProblema: orderData.equipamentoProblema || '',
      status: orderData.status || '',
      previsaoEntrega: orderData.previsaoEntrega ? 
        new Date(orderData.previsaoEntrega).toLocaleDateString('pt-BR') : 'Não definida',
      valor: this.formatCurrency(orderData.valor),
      valorEntrada: this.formatCurrency(orderData.valorEntrada),
      valorPago: this.formatCurrency(orderData.valorPago),
      saldo: this.formatCurrency((orderData.valor || 0) - (orderData.valorPago || 0) - (orderData.valorEntrada || 0)),
      descricaoServico: orderData.descricaoServico || '',
      formaPagamento: orderData.formaPagamento || '',
      rastreamentoExterno: orderData.rastreamentoExterno || '',
      osLink: orderData.osLink || ''
    }

    // Substituir todas as variáveis
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      message = message.replace(regex, String(value))
    }

    // Remover seções condicionais vazias
    message = message.replace(/{{#osLink}}[\s\S]*?{{\/osLink}}/g, (match) => {
      return variables.osLink ? match.replace(/{{#osLink}}|{{\/osLink}}/g, '') : ''
    })

    return this.sendTextMessage(formattedNumber, message)
  }

  private formatCurrency(value: any): string {
    if (value === undefined || value === null || value === '' || isNaN(Number(value))) {
      return 'R$ 0,00'
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value))
  }
}

// Função helper para criar instância da API
export function createEvolutionAPI(config: EvolutionConfig): EvolutionAPI {
  return new EvolutionAPI(config)
}