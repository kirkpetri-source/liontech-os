import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const statusList = await db.statusServico.findMany({
      orderBy: {
        nome: 'asc'
      }
    })
    
    return NextResponse.json(statusList)
  } catch (error) {
    console.error('Erro ao buscar status:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, descricao, cor } = body

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome do status é obrigatório' },
        { status: 400 }
      )
    }

    const status = await db.statusServico.create({
      data: {
        nome,
        descricao,
        cor: cor || '#6B7280'
      }
    })

    return NextResponse.json(status, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar status:', error)
    return NextResponse.json(
      { error: 'Erro ao criar status' },
      { status: 500 }
    )
  }
}