export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

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
  }
  impressao?: {
    cabecalhoOrdens?: boolean
    rodapePersonalizado?: string
    logoUrl?: string
    copiaCliente?: boolean
    mostrarPrecos?: boolean
  }
  seguranca?: {
    doisFatores?: boolean
    expiracaoSenha?: boolean
    logAtividades?: boolean
    sessao?: string
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
}

export async function GET() {
  try {
    const snap = await docRef().get()
    if (!snap.exists) {
      return NextResponse.json(defaults, { status: 200 })
    }
    const cfg = (snap.data() as Config) || {}
    return NextResponse.json({ ...defaults, ...cfg }, { status: 200 })
  } catch (err) {
    console.error('GET /api/config error:', err)
    return NextResponse.json(defaults, { status: 200 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Config
    const payload: Config = { ...body, updatedAt: new Date().toISOString() }
    await docRef().set(payload, { merge: true })
    const snap = await docRef().get()
    return NextResponse.json(snap.data() || {}, { status: 200 })
  } catch (err) {
    console.error('PUT /api/config error:', err)
    return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
  }
}