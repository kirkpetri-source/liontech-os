import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar categorias padrão
  const categorias = [
    { nome: 'Notebooks', descricao: 'Serviços para notebooks e laptops' },
    { nome: 'Desktops', descricao: 'Manutenção em computadores de mesa' },
    { nome: 'Smartphones', descricao: 'Reparos em celulares e smartphones' },
    { nome: 'Tablets', descricao: 'Serviços para tablets' },
    { nome: 'Monitores', descricao: 'Reparos em monitores e telas' },
    { nome: 'Impressoras', descricao: 'Manutenção em impressoras' },
    { nome: 'Outros', descricao: 'Outros tipos de equipamentos' }
  ]

  console.log('📁 Criando categorias...')
  for (const categoria of categorias) {
    await prisma.categoriaServico.upsert({
      where: { nome: categoria.nome },
      update: categoria,
      create: categoria
    })
  }

  // Criar status padrão
  const statusList = [
    { nome: 'Recebido', descricao: 'Equipamento recebido para análise', cor: '#8B5CF6' },
    { nome: 'Em Andamento', descricao: 'Serviço sendo executado', cor: '#3B82F6' },
    { nome: 'Aguardando Peça', descricao: 'Aguardando chegada de peça', cor: '#F59E0B' },
    { nome: 'Aguardando Orçamento', descricao: 'Aguardando aprovação do orçamento', cor: '#EC4899' },
    { nome: 'Concluído', descricao: 'Serviço finalizado com sucesso', cor: '#10B981' },
    { nome: 'Entregue', descricao: 'Equipamento entregue ao cliente', cor: '#059669' },
    { nome: 'Cancelado', descricao: 'Serviço cancelado', cor: '#EF4444' }
  ]

  console.log('📊 Criando status...')
  for (const status of statusList) {
    await prisma.statusServico.upsert({
      where: { nome: status.nome },
      update: status,
      create: status
    })
  }

  console.log('✅ Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })