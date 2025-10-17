import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const authed = await requireAuth()
  if (!authed) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const ordensServico = await db.ordemServico.findMany({
      include: {
        cliente: true,
        categoria: true,
        status: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(ordensServico)
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ordens de serviço' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authed = await requireAuth()
  if (!authed) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = await request.json()
    const {
      clienteId,
      equipamentoModelo,
      equipamentoProblema,
      equipamentoSenha,
      acessorios,
      categoriaId,
      statusId,
      terceirizado,
      servicoTerceirizado,
      rastreamentoExterno,
      descricaoServico,
      valor,
      previsaoEntrega
    } = body

    const lastOS = await db.ordemServico.findFirst({
      orderBy: { createdAt: 'desc' }
    })
    
    const nextNumber = lastOS ? parseInt(lastOS.numeroOS.split('-')[1]) + 1 : 1
    const numeroOS = `OS-${String(nextNumber).padStart(3, '0')}`

    const ordemServico = await db.ordemServico.create({
      data: {
        numeroOS,
        clienteId,
        equipamentoModelo,
        equipamentoProblema,
        equipamentoSenha,
        acessorios,
        categoriaId,
        statusId,
        terceirizado: terceirizado || false,
        servicoTerceirizado,
        rastreamentoExterno,
        descricaoServico,
        valor: valor ? parseFloat(valor) : null,
        previsaoEntrega: previsaoEntrega ? new Date(previsaoEntrega) : null
      },
      include: {
        cliente: true,
        categoria: true,
        status: true
      }
    })

    return NextResponse.json(ordemServico, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar ordem de serviço:', error)
    return NextResponse.json(
      { error: 'Erro ao criar ordem de serviço' },
      { status: 500 }
    )
  }
}