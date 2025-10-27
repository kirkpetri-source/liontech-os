# Integração EvolutionAPI - WhatsApp

## Visão Geral

Esta documentação descreve a integração completa com a EvolutionAPI para envio de mensagens WhatsApp, incluindo ordens de serviço para clientes.

## Arquitetura

### Componentes Implementados

1. **Biblioteca de Integração** (`src/lib/evolution-api.ts`)
   - Classe `EvolutionAPI` com métodos para todas as operações
   - Tratamento de erros e reconexão automática
   - Formatação automática de números brasileiros
   - Validação de webhooks com assinatura HMAC

2. **Rotas API**
   - `/api/evolution/send` - Envio de mensagens
   - `/api/evolution/instance` - Gerenciamento de instância
   - `/api/evolution/webhook` - Recebimento de mensagens
   - `/api/evolution/test` - Testes e diagnósticos

3. **Sistema de Configuração**
   - Configurações integradas ao sistema existente
   - Proteção por senha administrativa
   - Validação de credenciais

## Configuração

### 1. Configurações Necessárias

Acesse **Configurações > EvolutionAPI** e configure:

```json
{
  "baseUrl": "https://sua-evolution-api.com",
  "instanceName": "nome-da-instancia",
  "token": "seu-token-api",
  "webhook": "https://seu-dominio.com/api/evolution/webhook",
  "webhookSecret": "segredo-para-validacao",
  "osShareSecret": "segredo-para-links-seguros",
  "messageTemplate": "template-personalizado",
  "enabled": true
}
```

### 2. Variáveis de Ambiente (Opcionais)

```env
EVOLUTION_BASE_URL=https://sua-evolution-api.com
EVOLUTION_INSTANCE_NAME=nome-da-instancia
EVOLUTION_TOKEN=seu-token-api
EVOLUTION_WEBHOOK_SECRET=segredo-webhook
```

## Endpoints da API

### 1. Envio de Mensagens

**POST** `/api/evolution/send`

#### Parâmetros:

```json
{
  "osId": "id-da-ordem-servico",     // Para enviar O.S.
  "to": "5511999999999",             // Número destino (opcional se osId fornecido)
  "mode": "os|text|media|document",  // Tipo de envio
  "text": "Mensagem de texto",        // Para mode=text
  "mediaUrl": "https://...",         // Para mode=media/document
  "fileName": "arquivo.pdf"          // Para mode=document
}
```

#### Exemplos:

**Enviar Ordem de Serviço:**
```bash
curl -X POST http://localhost:3000/api/evolution/send \
  -H "Content-Type: application/json" \
  -H "Cookie: session=seu-token-sessao" \
  -d '{"osId": "ordem123", "mode": "os"}'
```

**Enviar Texto Simples:**
```bash
curl -X POST http://localhost:3000/api/evolution/send \
  -H "Content-Type: application/json" \
  -H "Cookie: session=seu-token-sessao" \
  -d '{"to": "5511999999999", "mode": "text", "text": "Olá!"}'
```

**Enviar Documento:**
```bash
curl -X POST http://localhost:3000/api/evolution/send \
  -H "Content-Type: application/json" \
  -H "Cookie: session=seu-token-sessao" \
  -d '{
    "to": "5511999999999",
    "mode": "document",
    "mediaUrl": "https://exemplo.com/arquivo.pdf",
    "fileName": "documento.pdf",
    "text": "Segue o documento solicitado"
  }'
```

### 2. Gerenciamento de Instância

**GET** `/api/evolution/instance`
- Retorna status da instância e QR code se necessário

**POST** `/api/evolution/instance`
```json
{
  "action": "create|restart|delete|qrcode|status|logs"
}
```

### 3. Webhook (Recebimento)

**POST** `/api/evolution/webhook`
- Recebe mensagens e atualizações de status
- Valida assinatura HMAC
- Processa respostas de clientes automaticamente

### 4. Testes e Diagnósticos

**GET** `/api/evolution/test`
- Diagnóstico rápido sem envio

**POST** `/api/evolution/test`
```json
{
  "to": "5511999999999",
  "text": "Mensagem de teste"
}
```

## Funcionalidades

### 1. Envio de Ordens de Serviço

- **Template Personalizado**: Configure mensagens com variáveis
- **Links Seguros**: Gera links criptografados para visualização
- **Formatação Automática**: Valores monetários e datas em português

#### Variáveis Disponíveis no Template:

```
{{clienteNome}}         - Nome do cliente
{{clienteWhatsapp}}     - WhatsApp do cliente
{{numeroOS}}            - Número da O.S.
{{status}}              - Status atual
{{equipamentoModelo}}   - Modelo do equipamento
{{equipamentoProblema}} - Problema relatado
{{previsaoEntrega}}     - Data de previsão
{{categoria}}           - Categoria do serviço
{{descricaoServico}}    - Descrição do serviço
{{formaPagamento}}      - Forma de pagamento
{{valor}}               - Valor total
{{valorEntrada}}        - Valor de entrada
{{valorPago}}           - Valor pago
{{saldo}}               - Saldo restante
{{rastreamentoExterno}} - Código/link de rastreamento externo
{{osLink}}              - Link seguro da O.S.
```

#### Template Padrão:

```
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
```

Observações sobre links:
- Para o link aparecer clicável no WhatsApp, prefira um domínio público com `https`.
- Em ambientes com túneis/reverse proxies (ngrok, Cloudflare Tunnel), os cabeçalhos `x-forwarded-host` e `x-forwarded-proto` são considerados para montar o link corretamente.
- Garanta que o segredo `osShareSecret` esteja configurado em Configurações > WhatsApp EvolutionAPI para geração do token de compartilhamento.

### 2. Processamento de Respostas

O sistema automaticamente:
- Monitora respostas de clientes
- Vincula respostas às ordens de serviço correspondentes
- Atualiza timestamp de última interação
- Salva histórico de mensagens

### 3. Segurança

- **Autenticação**: Todas as rotas protegidas por sessão
- **Validação de Webhook**: Assinatura HMAC SHA-256
- **Links Seguros**: Tokens criptografados para visualização de O.S.
- **Sanitização**: Formatação segura de números de telefone

### 4. Monitoramento

- **Logs Detalhados**: Todas as operações são registradas
- **Status em Tempo Real**: Monitoramento da conexão da instância
- **Diagnósticos**: Testes automatizados de conectividade
- **Métricas**: Contadores de mensagens enviadas/recebidas

## Tratamento de Erros

### Códigos de Erro Comuns:

- **401**: Token inválido ou expirado
- **403**: Acesso negado ou instância não autorizada
- **404**: Instância não encontrada
- **409**: Instância não conectada
- **422**: Número de telefone inválido
- **500**: Erro interno da EvolutionAPI

### Reconexão Automática:

- Retry automático com backoff exponencial
- Máximo de 3 tentativas por operação
- Delay progressivo: 1s, 2s, 4s

## Integração com Sistema Existente

### 1. Compatibilidade

A EvolutionAPI funciona em paralelo com:
- WhatsApp Cloud API
- WhatsApp Web (local)

### 2. Migração

Para migrar do WhatsApp Cloud:
1. Configure a EvolutionAPI
2. Teste com números de desenvolvimento
3. Altere o modo de envio nas configurações
4. Monitore logs para verificar funcionamento

### 3. Fallbacks

Em caso de falha da EvolutionAPI:
- Sistema mantém configurações do WhatsApp Cloud
- Possibilidade de alternar entre APIs
- Logs indicam qual API foi utilizada

## Exemplos de Uso

### 1. Envio Programático de O.S.

```typescript
import { createEvolutionAPI } from '@/lib/evolution-api'

const api = createEvolutionAPI({
  baseUrl: 'https://sua-evolution-api.com',
  instanceName: 'instancia',
  token: 'seu-token'
})

// Enviar O.S. formatada
await api.sendOrderService('5511999999999', {
  numeroOS: 'OS-001',
  clienteNome: 'João Silva',
  status: 'Em Andamento',
  equipamentoModelo: 'iPhone 12',
  equipamentoProblema: 'Tela quebrada',
  valor: 350.00,
  osLink: 'https://sistema.com/os/123?t=token'
})
```

### 2. Webhook Handler Personalizado

```typescript
// Processar mensagem recebida
export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('x-signature')
  
  // Validar assinatura
  const api = createEvolutionAPI(config)
  if (!api.validateWebhookSignature(body, signature, secret)) {
    return new Response('Invalid signature', { status: 401 })
  }
  
  const data = JSON.parse(body)
  
  // Processar mensagem
  if (!data.data.key.fromMe) {
    await processCustomerMessage(data)
  }
  
  return new Response('OK')
}
```

## Troubleshooting

### Problemas Comuns:

1. **Instância não conecta**
   - Verificar URL e token
   - Confirmar que instância existe na EvolutionAPI
   - Verificar logs da EvolutionAPI

2. **Mensagens não chegam**
   - Verificar status da instância
   - Confirmar formato do número (E.164)
   - Verificar se número está no WhatsApp

3. **Webhook não funciona**
   - Verificar URL do webhook
   - Confirmar que endpoint está acessível
   - Validar assinatura HMAC

4. **QR Code não aparece**
   - Verificar se instância precisa de autenticação
   - Tentar restart da instância
   - Verificar logs da EvolutionAPI

### Logs Úteis:

```bash
# Verificar logs do sistema
tail -f logs/evolution-api.log

# Testar conectividade
curl -X GET http://localhost:3000/api/evolution/test

# Verificar status da instância
curl -X GET http://localhost:3000/api/evolution/instance
```

## Suporte

Para suporte técnico:
1. Verificar logs do sistema
2. Executar diagnósticos automáticos
3. Consultar documentação da EvolutionAPI
4. Verificar configurações de rede/firewall

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2025  
**Compatibilidade**: EvolutionAPI v1.x+