export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { hashPassword, verifyPassword } from '@/lib/auth'

type Config = {
  empresa?: {
    nome?: string
    cnpj?: string
    telefone?: string
    email?: string
    endereco?: string
  }
  sistema?: {
    notificacoesEmail?: boolean
    backupAutomatico?: boolean
    modoEscuro?: boolean
    confirmacaoAcoes?: boolean
    moedaPadrao?: string
    rodapeLinks?: { label?: string; url?: string }[]
  }
  impressao?: {
    cabecalhoOrdens?: boolean
    rodapePersonalizado?: string
    logoUrl?: string
    copiaCliente?: boolean
    mostrarPrecos?: boolean
    rodapeHabilitado?: boolean
    codigoBarras?: boolean
    tamanhoPapel?: string
  }
  seguranca?: {
    doisFatores?: boolean
    expiracaoSenha?: boolean
    logAtividades?: boolean
    sessao?: string
    configKeyHash?: string
  }
  notifications?: {
    enabled?: boolean
    numbers?: string[]
  }
  whatsapp?: {
    phoneId?: string
    token?: string
    templateName?: string
    templateLang?: string
    mode?: 'cloud' | 'web'
    osShareSecret?: string
    messageTemplate?: string
  }
  evolution?: {
    baseUrl?: string
    instanceName?: string
    token?: string
    webhook?: string
    webhookSecret?: string
    osShareSecret?: string
    messageTemplate?: string
    enabled?: boolean
  }
  updatedAt?: string
}

const docRef = () => adminDb.collection('config').doc('geral')

const defaults: Config = {
  empresa: {
    nome: 'Lion Tech',
    cnpj: '',
    telefone: '(11) 9999-9999',
    email: 'contato@liontech.com.br',
    endereco: 'São Paulo - SP',
  },
  sistema: {
    notificacoesEmail: false,
    backupAutomatico: false,
    modoEscuro: false,
    confirmacaoAcoes: false,
    moedaPadrao: 'BRL',
    rodapeLinks: [],
  },
  impressao: {
    cabecalhoOrdens: true,
    rodapePersonalizado: '',
  },
  seguranca: {
    doisFatores: false,
    expiracaoSenha: false,
    logAtividades: true,
    sessao: '8h',
  },
  notifications: {
    enabled: true,
    numbers: ['5564999555364']
  }
}

export async function GET() {
  try {
    const snap = await docRef().get()
    if (!snap.exists) {
      return NextResponse.json(defaults, { status: 200 })
    }
    const cfg = (snap.data() as Config) || {}
    const merged: Config = { ...defaults, ...cfg }
    // Mascara o segredo de compartilhamento, se existir
    if (merged.whatsapp?.osShareSecret) {
      merged.whatsapp = {
        ...merged.whatsapp,
        osShareSecret: '********'
      }
    }
    return NextResponse.json(merged, { status: 200 })
  } catch (err) {
    console.error('GET /api/config error:', err)
    return NextResponse.json(defaults, { status: 200 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Config & { seguranca?: { configKeyRaw?: string } }

    // Carrega configuração atual para validação de chave administrativa
    const currentSnap = await docRef().get()
    const current = (currentSnap.data() || {}) as Config
    const storedHash = current?.seguranca?.configKeyHash
    const envKey = process.env.ADMIN_CONFIG_PASSWORD

    async function ensureAdminKey(headerKey: string | null | undefined): Promise<boolean> {
      if (storedHash) {
        if (!headerKey) return false
        return verifyPassword(headerKey, storedHash)
      }
      if (envKey) {
        return headerKey === envKey
      }
      // Sem proteção configurada ainda
      return true
    }

    const adminKeyHeader = req.headers.get('x-admin-key') || req.headers.get('X-Admin-Key')

    // Atualização da senha administrativa (se fornecida)
    if (body?.seguranca && (body as any).seguranca.configKeyRaw) {
      // Se já existe uma senha definida, exigir a atual no cabeçalho
      const allowed = await ensureAdminKey(adminKeyHeader)
      if (!allowed) {
        return NextResponse.json({ error: 'Senha administrativa inválida' }, { status: 403 })
      }
      const newHash = await hashPassword((body as any).seguranca.configKeyRaw as string)
      // Não persistir o campo raw
      delete (body as any).seguranca.configKeyRaw
      body.seguranca = { ...(current.seguranca || {}), ...body.seguranca, configKeyHash: newHash }
    }

    // Protege a atualização dos campos sensíveis de WhatsApp
    if (body?.whatsapp) {
      const allowed = await ensureAdminKey(adminKeyHeader)
      if (!allowed) {
        return NextResponse.json({ error: 'Senha administrativa inválida' }, { status: 403 })
      }
      // Mescla preservando segredo quando mascarado ou vazio
      const incoming = body.whatsapp
      const currWhats = current.whatsapp || {}
      const nextWhats: NonNullable<Config['whatsapp']> = { ...currWhats, ...incoming }
      if (typeof incoming.osShareSecret === 'string') {
        const v = (incoming.osShareSecret || '').trim()
        if (v === '' || v === '********') {
          nextWhats.osShareSecret = currWhats.osShareSecret
        } else {
          nextWhats.osShareSecret = v
        }
      }
      body.whatsapp = nextWhats
    }

    const payload: Config = { ...body, updatedAt: new Date().toISOString() }
    await docRef().set(payload, { merge: true })
    const snap = await docRef().get()
    return NextResponse.json(snap.data() || {}, { status: 200 })
  } catch (err) {
    console.error('PUT /api/config error:', err)
    return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
  }
}