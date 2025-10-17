#!/usr/bin/env tsx
/*
 * Upsert de admin: procura um usuário com nivel 'admin'.
 * - Se existir, atualiza usuario e senha
 * - Se não existir, cria um novo admin
 * Pode ser parametrizado via env: ADMIN_USUARIO, ADMIN_SENHA, ADMIN_EMAIL, ADMIN_NOME
 */
import { adminDb } from '@/lib/firebase-admin'
import { hashPassword } from '@/lib/auth'

async function main() {
  const usuario = (process.env.ADMIN_USUARIO || 'admin').toLowerCase()
  const senha = process.env.ADMIN_SENHA || 'Admin@1234'
  const email = (process.env.ADMIN_EMAIL || 'admin@local').toLowerCase()
  const nome = (process.env.ADMIN_NOME || 'ADMINISTRADOR').toUpperCase()

  console.log(`Upsert admin -> usuario: ${usuario}`)

  // Verifica se já existe admin
  const snap = await adminDb
    .collection('usuarios')
    .where('nivel', '==', 'admin')
    .limit(1)
    .get()

  const senhaHash = await hashPassword(senha)

  if (!snap.empty) {
    const doc = snap.docs[0]
    await adminDb.collection('usuarios').doc(doc.id).set(
      {
        usuario,
        email,
        nome,
        cargo: 'ADMIN',
        status: 'ativo',
        ultimoAcesso: 'Nunca',
        senhaHash
      },
      { merge: true }
    )
    console.log(`Admin atualizado: id=${doc.id}`)
  } else {
    const novo = {
      usuario,
      email,
      nome,
      cargo: 'ADMIN',
      nivel: 'admin' as const,
      status: 'ativo' as const,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      ultimoAcesso: 'Nunca',
      senhaHash
    }
    const ref = await adminDb.collection('usuarios').add(novo)
    console.log(`Admin criado: id=${ref.id}`)
  }

  console.log(`Credenciais definidas: usuario='${usuario}', senha='${senha}'`)
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('Falha no upsert de admin:', err)
  process.exit(1)
})