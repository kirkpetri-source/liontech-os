export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    return NextResponse.json(user, { status: 200 })
  } catch (err) {
    console.error('GET /api/auth/me error:', err)
    return NextResponse.json({ error: 'Falha ao obter sessão' }, { status: 500 })
  }
}