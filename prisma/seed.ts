import { db } from '@/lib/db'

async function seed() {
  try {
    console.log('Populando banco de dados...')

    // Criar categorias
    const categorias = await Promise.all([
      db.categoriaServico.create({
        data: { nome: 'Notebook', descricao: 'Consertos de notebooks e laptops' }
      }),
      db.categoriaServico.create({
        data: { nome: 'Desktop', descricao: 'Consertos de computadores de mesa' }
      }),
      db.categoriaServico.create({
        data: { nome: 'Celular', descricao: 'Consertos de smartphones' }
      }),
      db.categoriaServico.create({
        data: { nome: 'Tablet', descricao: 'Consertos de tablets' }
      }),
      db.categoriaServico.create({
        data: { nome: 'Monitor', descricao: 'Consertos de monitores' }
      }),
      db.categoriaServico.create({
        data: { nome: 'Impressora', descricao: 'Consertos de impressoras' }
      }),
      db.categoriaServico.create({
        data: { nome: 'Outros', descricao: 'Outros tipos de equipamentos' }
      })
    ])

    // Criar status
    const statusList = await Promise.all([
      db.statusServico.create({
        data: { nome: 'Recebido', descricao: 'Equipamento recebido para análise', cor: '#8B5CF6' }
      }),
      db.statusServico.create({
        data: { nome: 'Em Andamento', descricao: 'Serviço em andamento', cor: '#3B82F6' }
      }),
      db.statusServico.create({
        data: { nome: 'Aguardando Peça', descricao: 'Aguardando chegada de peças', cor: '#F59E0B' }
      }),
      db.statusServico.create({
        data: { nome: 'Concluído', descricao: 'Serviço concluído', cor: '#10B981' }
      }),
      db.statusServico.create({
        data: { nome: 'Entregue', descricao: 'Equipamento entregue ao cliente', cor: '#06B6D4' }
      }),
      db.statusServico.create({
        data: { nome: 'Cancelado', descricao: 'Serviço cancelado', cor: '#EF4444' }
      })
    ])

    // Criar clientes de exemplo
    const clientes = await Promise.all([
      db.cliente.create({
        data: { nome: 'João Silva', whatsapp: '(11) 99999-8888' }
      }),
      db.cliente.create({
        data: { nome: 'Maria Santos', whatsapp: '(11) 97777-6666' }
      }),
      db.cliente.create({
        data: { nome: 'Pedro Costa', whatsapp: '(11) 95555-4444' }
      })
    ])

    console.log('Banco de dados populado com sucesso!')
    console.log(`Categorias: ${categorias.length}`)
    console.log(`Status: ${statusList.length}`)
    console.log(`Clientes: ${clientes.length}`)

  } catch (error) {
    console.error('Erro ao popular banco de dados:', error)
    throw error
  }
}

seed()
  .then(() => {
    console.log('Seed concluído com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erro no seed:', error)
    process.exit(1)
  })