import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export type AuthUser = {
  id: string
  nome: string
  email?: string
  nivel?: 'admin' | 'gerente' | 'tecnico' | 'recepcao'
  status?: 'ativo' | 'inativo'
  usuario?: string
}

const COOKIE_NAME = 'session'
const TOKEN_TTL = '7d'

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET não definido nas variáveis de ambiente')
  return secret
}

export async function hashPassword(raw: string): Promise<string> {
  return bcrypt.hash(raw, 10)
}

export async function verifyPassword(raw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(raw, hash)
}

export function signToken(payload: { sub: string; nome?: string; email?: string; nivel?: string }): string {
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_TTL })
}

export function verifyToken(token: string): { sub: string; nome?: string; email?: string; nivel?: string } | null {
  try {
    return jwt.verify(token, getSecret()) as any
  } catch {
    return null
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded?.sub) return null
  const snap = await adminDb.collection('usuarios').doc(decoded.sub).get()
  const data = snap.data() as any
  if (!data) return null
  return { id: snap.id, nome: data.nome, email: data.email, nivel: data.nivel, status: data.status, usuario: data.usuario }
}

export function setSessionCookie(token: string): NextResponse {
  const res = NextResponse.json({ ok: true })
  res.cookies.set({ name: COOKIE_NAME, value: token, httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60, secure: process.env.NODE_ENV === 'production' })
  return res
}

export function clearSessionCookie(): NextResponse {
  const res = NextResponse.json({ ok: true })
  res.cookies.set({ name: COOKIE_NAME, value: '', path: '/', maxAge: 0 })
  return res
}

export async function requireAuth(): Promise<AuthUser | null> {
  return getAuthUser()
}