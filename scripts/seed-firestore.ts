import { adminDb } from '../src/lib/firebase-admin'

type Categoria = {
  nome: string
  descricao: string
  cor?: string
  ativa?: boolean
  quantidadeOS?: number
}

type Status = {
  nome: string
  descricao: string
  cor?: string
  tipo?: 'inicial' | 'andamento' | 'final' | 'cancelado'
  padrao?: boolean
  ordem?: number
}

async function upsertByNome<T extends Record<string, any>>(collection: string, data: T & { nome: string }) {
  const existing = await adminDb.collection(collection).where('nome', '==', data.nome).limit(1).get()
  if (existing.empty) {
    const ref = await adminDb.collection(collection).add(data)
    return { action: 'created', id: ref.id, data }
  } else {
    const doc = existing.docs[0]
    await adminDb.collection(collection).doc(doc.id).set(data, { merge: true })
    return { action: 'updated', id: doc.id, data }
  }
}

async function main() {
  const categorias: Categoria[] = [
    { nome: 'Notebooks', descricao: 'Serviços para notebooks e laptops', cor: '#3B82F6', ativa: true, quantidadeOS: 0 },
    { nome: 'Desktops', descricao: 'Manutenção em computadores de mesa', cor: '#06B6D4', ativa: true, quantidadeOS: 0 },
    { nome: 'Smartphones', descricao: 'Reparos em celulares e smartphones', cor: '#10B981', ativa: true, quantidadeOS: 0 },
    { nome: 'Tablets', descricao: 'Serviços para tablets', cor: '#8B5CF6', ativa: true, quantidadeOS: 0 },
  ]

  const statusList: Status[] = [
    { nome: 'Recebido', descricao: 'Equipamento recebido para análise', cor: '#8B5CF6', tipo: 'inicial', padrao: true, ordem: 1 },
    { nome: 'Em Andamento', descricao: 'Serviço sendo executado', cor: '#3B82F6', tipo: 'andamento', padrao: false, ordem: 2 },
    { nome: 'Aguardando Peça', descricao: 'Aguardando chegada de peça', cor: '#F59E0B', tipo: 'andamento', padrao: false, ordem: 3 },
    { nome: 'Concluído', descricao: 'Serviço finalizado com sucesso', cor: '#10B981', tipo: 'final', padrao: false, ordem: 4 },
    { nome: 'Entregue', descricao: 'Equipamento entregue ao cliente', cor: '#059669', tipo: 'final', padrao: false, ordem: 5 },
    { nome: 'Cancelado', descricao: 'Serviço cancelado', cor: '#EF4444', tipo: 'cancelado', padrao: false, ordem: 6 },
  ]

  const results: any = { categorias: [], status: [] }

  for (const c of categorias) {
    const r = await upsertByNome('categorias', c)
    results.categorias.push(r)
  }

  for (const s of statusList) {
    const r = await upsertByNome('status', s)
    results.status.push(r)
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2))
}

main().catch((err) => {
  console.error('Seed Firestore error:', err)
  process.exit(1)
})