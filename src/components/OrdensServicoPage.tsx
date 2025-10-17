'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, 
  Save, 
  Phone, 
  User, 
  Plus,
  X,
  Edit,
  Trash2,
  Search,
  Filter,
  Wrench,
  Monitor,
  Smartphone,
  Laptop,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Printer,
  CreditCard,
  DollarSign,
  Loader2
} from 'lucide-react'

interface OrdemServico {
  id: string
  numeroOS: string
  clienteNome: string
  clienteWhatsapp: string
  equipamentoModelo: string
  equipamentoProblema: string
  equipamentoSenha?: string
  acessorios?: string
  categoria: string
  status: string
  terceirizado: boolean
  servicoTerceirizado?: string
  rastreamentoExterno?: string
  descricaoServico?: string
  valor?: number
  previsaoEntrega?: string
  pago: boolean
  valorPago?: number
  valorEntrada?: number
  formaPagamento?: string
  formaPagamentoEntrada?: string
  createdAt: string
}

interface Categoria {
  id: string
  nome: string
  descricao?: string
}

interface Status {
  id: string
  nome: string
  descricao?: string
  cor?: string
}

export default function OrdensServicoPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingOS, setEditingOS] = useState<OrdemServico | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Em Andamento')
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [statusList, setStatusList] = useState<Status[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState(true)

  const [formData, setFormData] = useState({
    clienteNome: '',
    clienteWhatsapp: '',
    equipamentoModelo: '',
    equipamentoProblema: '',
    equipamentoSenha: '',
    acessorios: '',
    categoria: '',
    status: '',
    terceirizado: false,
    servicoTerceirizado: '',
    rastreamentoExterno: '',
    descricaoServico: '',
    valor: '',
    previsaoEntrega: '',
    previsaoEntregaHora: '',
    pago: false,
    valorPago: '',
    valorEntrada: '',
    formaPagamento: '',
    formaPagamentoEntrada: ''
  })

  const formasPagamento = ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência Bancária', 'Boleto']

  // Dados fallback caso as APIs falhem
  const categoriasFallback: Categoria[] = [
    { id: '1', nome: 'Notebooks', descricao: 'Serviços para notebooks e laptops' },
    { id: '2', nome: 'Desktops', descricao: 'Manutenção em computadores de mesa' },
    { id: '3', nome: 'Smartphones', descricao: 'Reparos em celulares e smartphones' },
    { id: '4', nome: 'Tablets', descricao: 'Serviços para tablets' },
    { id: '5', nome: 'Monitores', descricao: 'Reparos em monitores e telas' },
    { id: '6', nome: 'Impressoras', descricao: 'Manutenção em impressoras' },
    { id: '7', nome: 'Outros', descricao: 'Outros tipos de equipamentos' }
  ]

  const statusFallback: Status[] = [
    { id: '1', nome: 'Recebido', descricao: 'Equipamento recebido para análise', cor: '#8B5CF6' },
    { id: '2', nome: 'Em Andamento', descricao: 'Serviço sendo executado', cor: '#3B82F6' },
    { id: '3', nome: 'Aguardando Peça', descricao: 'Aguardando chegada de peça', cor: '#F59E0B' },
    { id: '4', nome: 'Aguardando Orçamento', descricao: 'Aguardando aprovação do orçamento', cor: '#EC4899' },
    { id: '5', nome: 'Concluído', descricao: 'Serviço finalizado com sucesso', cor: '#10B981' },
    { id: '6', nome: 'Entregue', descricao: 'Equipamento entregue ao cliente', cor: '#059669' },
    { id: '7', nome: 'Cancelado', descricao: 'Serviço cancelado', cor: '#EF4444' }
  ]

  // Carregar ordens do banco de dados
  useEffect(() => {
    const fetchOrdens = async () => {
      try {
        const response = await fetch('/api/ordens')
        if (response.ok) {
          const data = await response.json()
          setOrdensServico(data)
        }
      } catch (error) {
        console.error('Erro ao buscar ordens de serviço:', error)
      }
    }

    fetchOrdens()
  }, [])

  // Carregar categorias do banco de dados
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch('/api/categorias')
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            setCategorias(data)
          } else {
            setCategorias(categoriasFallback)
          }
        } else {
          setCategorias(categoriasFallback)
        }
      } catch (error) {
        console.error('Erro ao buscar categorias, usando fallback:', error)
        setCategorias(categoriasFallback)
      } finally {
        setLoadingCategorias(false)
      }
    }

    fetchCategorias()
  }, [])

  // Carregar status do banco de dados
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status')
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            setStatusList(data)
          } else {
            setStatusList(statusFallback)
          }
        } else {
          setStatusList(statusFallback)
        }
      } catch (error) {
        console.error('Erro ao buscar status, usando fallback:', error)
        setStatusList(statusFallback)
      } finally {
        setLoadingStatus(false)
      }
    }

    fetchStatus()
  }, [])

  const filteredOrdens = ordensServico.filter(os => {
    const matchesSearch = 
      os.numeroOS.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.equipamentoModelo.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'Todos' || os.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handlePrint = (os: OrdemServico) => {
    const printContent = `
      <html>
        <head>
          <title>Ordem de Serviço ${os.numeroOS}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
            .field { margin-bottom: 5px; }
            .label { font-weight: bold; display: inline-block; width: 150px; }
            .value { display: inline-block; }
            .status { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; }
            .payment-info { background-color: #f5f5f5; padding: 10px; border-radius: 4px; }
            @media print { body { margin: 10px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Lion Tech - Sistema de Gestão</div>
            <div>Ordem de Serviço ${os.numeroOS}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Dados do Cliente</div>
            <div class="field"><span class="label">Nome:</span> <span class="value">${os.clienteNome}</span></div>
            <div class="field"><span class="label">WhatsApp:</span> <span class="value">${os.clienteWhatsapp}</span></div>
          </div>
          
          <div class="section">
            <div class="section-title">Dados do Equipamento</div>
            <div class="field"><span class="label">Categoria:</span> <span class="value">${os.categoria}</span></div>
            <div class="field"><span class="label">Modelo:</span> <span class="value">${os.equipamentoModelo}</span></div>
            <div class="field"><span class="label">Problema:</span> <span class="value">${os.equipamentoProblema}</span></div>
            ${os.acessorios ? `<div class="field"><span class="label">Acessórios:</span> <span class="value">${os.acessorios}</span></div>` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">Detalhes do Serviço</div>
            <div class="field"><span class="label">Status:</span> <span class="value status" style="background-color: ${os.status === 'Concluído' ? '#10b981' : os.status === 'Em Andamento' ? '#3b82f6' : '#f59e0b'}">${os.status}</span></div>
            ${os.valor ? `<div class="field"><span class="label">Valor:</span> <span class="value">R$ ${os.valor.toFixed(2)}</span></div>` : ''}
            ${os.previsaoEntrega ? `<div class="field"><span class="label">Previsão Entrega:</span> <span class="value">${new Date(os.previsaoEntrega).toLocaleDateString('pt-BR')}</span></div>` : ''}
            ${os.descricaoServico ? `<div class="field"><span class="label">Descrição:</span> <span class="value">${os.descricaoServico}</span></div>` : ''}
          </div>
          
          <div class="section payment-info">
            <div class="section-title">Informações de Pagamento</div>
            <div class="field"><span class="label">Pago:</span> <span class="value">${os.pago ? 'Sim' : 'Não'}</span></div>
            ${os.pago && os.valorPago ? `<div class="field"><span class="label">Valor Pago:</span> <span class="value">R$ ${os.valorPago.toFixed(2)}</span></div>` : ''}
            ${os.pago && os.formaPagamento ? `<div class="field"><span class="label">Forma Pagamento:</span> <span class="value">${os.formaPagamento}</span></div>` : ''}
            ${os.valorEntrada ? `<div class="field"><span class="label">Valor Entrada:</span> <span class="value">R$ ${os.valorEntrada.toFixed(2)}</span></div>` : ''}
            ${os.valorEntrada && os.formaPagamentoEntrada ? `<div class="field"><span class="label">Forma Entrada:</span> <span class="value">${os.formaPagamentoEntrada}</span></div>` : ''}
            ${os.valor && (os.valorPago || os.valorEntrada) ? `<div class="field"><span class="label">Saldo Restante:</span> <span class="value">R$ ${(os.valor - (os.valorPago || 0) - (os.valorEntrada || 0)).toFixed(2)}</span></div>` : ''}
          </div>
          
          ${os.terceirizado ? `
          <div class="section">
            <div class="section-title">Terceirização</div>
            <div class="field"><span class="label">Serviço:</span> <span class="value">${os.servicoTerceirizado}</span></div>
            ${os.rastreamentoExterno ? `<div class="field"><span class="label">Rastreamento:</span> <span class="value">${os.rastreamentoExterno}</span></div>` : ''}
          </div>
          ` : ''}
          
          <div class="section">
            <div class="field"><span class="label">Data Criação:</span> <span class="value">${new Date(os.createdAt).toLocaleDateString('pt-BR')}</span></div>
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numeroOS = editingOS ? editingOS.numeroOS : `OS-${String(ordensServico.length + 1).padStart(3, '0')}`

    const formattedData = {
      clienteNome: formData.clienteNome.toUpperCase(),
      clienteWhatsapp: formData.clienteWhatsapp,
      equipamentoModelo: formData.equipamentoModelo.toUpperCase(),
      equipamentoProblema: formData.equipamentoProblema.toUpperCase(),
      equipamentoSenha: formData.equipamentoSenha,
      acessorios: formData.acessorios.toUpperCase(),
      categoria: formData.categoria,
      status: formData.status || 'Recebido',
      terceirizado: formData.terceirizado,
      servicoTerceirizado: formData.servicoTerceirizado.toUpperCase(),
      rastreamentoExterno: formData.rastreamentoExterno,
      descricaoServico: formData.descricaoServico.toUpperCase(),
      valor: formData.valor ? parseFloat(formData.valor) : undefined,
      previsaoEntrega: formData.previsaoEntrega && formData.previsaoEntregaHora 
        ? `${formData.previsaoEntrega}T${formData.previsaoEntregaHora}`
        : formData.previsaoEntrega,
      pago: formData.pago,
      valorPago: formData.valorPago ? parseFloat(formData.valorPago) : undefined,
      valorEntrada: formData.valorEntrada ? parseFloat(formData.valorEntrada) : undefined,
      formaPagamento: formData.formaPagamento || undefined,
      formaPagamentoEntrada: formData.formaPagamentoEntrada || undefined,
    }

    try {
      if (editingOS?.id) {
        const res = await fetch(`/api/ordens/${editingOS.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formattedData, numeroOS }),
        })
        if (res.ok) {
          const updated = await res.json()
          setOrdensServico(ordensServico.map(os => os.id === updated.id ? updated : os))
          setEditingOS(null)
        }
      } else {
        const res = await fetch('/api/ordens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formattedData, numeroOS }),
        })
        if (res.ok) {
          const created = await res.json()
          setOrdensServico([...ordensServico, created])
        }
      }
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço:', error)
    }

    setFormData({
      clienteNome: '',
      clienteWhatsapp: '',
      equipamentoModelo: '',
      equipamentoProblema: '',
      equipamentoSenha: '',
      acessorios: '',
      categoria: '',
      status: 'Recebido',
      terceirizado: false,
      servicoTerceirizado: '',
      rastreamentoExterno: '',
      descricaoServico: '',
      valor: '',
      previsaoEntrega: '',
      previsaoEntregaHora: '',
      pago: false,
      valorPago: '',
      valorEntrada: '',
      formaPagamento: '',
      formaPagamentoEntrada: ''
    })
    setShowForm(false)
  }

  const handleEdit = (os: OrdemServico) => {
    setEditingOS(os)
    
    // Separar data e hora da previsão de entrega
    const [data, hora] = os.previsaoEntrega ? os.previsaoEntrega.includes('T') 
      ? os.previsaoEntrega.split('T') 
      : [os.previsaoEntrega, ''] 
      : ['', '']
    
    setFormData({
      clienteNome: os.clienteNome,
      clienteWhatsapp: os.clienteWhatsapp,
      equipamentoModelo: os.equipamentoModelo,
      equipamentoProblema: os.equipamentoProblema,
      equipamentoSenha: os.equipamentoSenha || '',
      acessorios: os.acessorios || '',
      categoria: os.categoria,
      status: os.status,
      terceirizado: os.terceirizado,
      servicoTerceirizado: os.servicoTerceirizado || '',
      rastreamentoExterno: os.rastreamentoExterno || '',
      descricaoServico: os.descricaoServico || '',
      valor: os.valor?.toString() || '',
      previsaoEntrega: data,
      previsaoEntregaHora: hora,
      pago: os.pago,
      valorPago: os.valorPago?.toString() || '',
      valorEntrada: os.valorEntrada?.toString() || '',
      formaPagamento: os.formaPagamento || '',
      formaPagamentoEntrada: os.formaPagamentoEntrada || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/ordens/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setOrdensServico(ordensServico.filter(os => os.id !== id))
      }
    } catch (error) {
      console.error('Erro ao deletar ordem de serviço:', error)
    }
  }

  const handleFinalizarOS = async (id: string) => {
    try {
      const res = await fetch(`/api/ordens/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Concluído' }),
      })
      if (res.ok) {
        const updated = await res.json()
        setOrdensServico(ordensServico.map(os => os.id === id ? updated : os))
      }
    } catch (error) {
      console.error('Erro ao finalizar ordem de serviço:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Concluído": return "bg-green-100 text-green-800"
      case "Entregue": return "bg-emerald-100 text-emerald-800"
      case "Em Andamento": return "bg-blue-100 text-blue-800"
      case "Aguardando Peça": return "bg-orange-100 text-orange-800"
      case "Recebido": return "bg-purple-100 text-purple-800"
      case "Cancelado": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoriaIcon = (categoria: string) => {
    switch(categoria) {
      case "Notebook": return <Laptop className="w-4 h-4" />
      case "Desktop": return <Monitor className="w-4 h-4" />
      case "Celular": return <Smartphone className="w-4 h-4" />
      default: return <Wrench className="w-4 h-4" />
    }
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Wrench className="w-5 h-5" />
                    <span>{editingOS ? 'Editar O.S.' : 'Nova Ordem de Serviço'}</span>
                  </CardTitle>
                  <CardDescription>
                    {editingOS ? `Editando ${editingOS.numeroOS}` : 'Preencha os dados para criar uma nova ordem de serviço'}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowForm(false)
                    setEditingOS(null)
                    setFormData({
                      clienteNome: '',
                      clienteWhatsapp: '',
                      equipamentoModelo: '',
                      equipamentoProblema: '',
                      equipamentoSenha: '',
                      acessorios: '',
                      categoria: '',
                      status: 'Recebido',
                      terceirizado: false,
                      servicoTerceirizado: '',
                      rastreamentoExterno: '',
                      descricaoServico: '',
                      valor: '',
                      previsaoEntrega: '',
                      previsaoEntregaHora: ''
                    })
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados do Cliente */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 border-b pb-2">Dados do Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clienteNome">Nome do Cliente *</Label>
                      <Input
                        id="clienteNome"
                        placeholder="Nome completo do cliente"
                        value={formData.clienteNome}
                        onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clienteWhatsapp">WhatsApp *</Label>
                      <Input
                        id="clienteWhatsapp"
                        placeholder="(00) 00000-0000"
                        value={formData.clienteWhatsapp}
                        onChange={(e) => setFormData({ ...formData, clienteWhatsapp: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Dados do Equipamento */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 border-b pb-2">Dados do Equipamento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria *</Label>
                      <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })} disabled={loadingCategorias}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCategorias ? "Carregando..." : "Selecione a categoria"} />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingCategorias ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span className="text-sm">Carregando...</span>
                            </div>
                          ) : categorias.length === 0 ? (
                            <div className="p-2 text-sm text-slate-500 text-center">
                              Nenhuma categoria encontrada
                            </div>
                          ) : (
                            categorias.map((cat) => (
                              <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="equipamentoModelo">Modelo do Equipamento *</Label>
                      <Input
                        id="equipamentoModelo"
                        placeholder="Ex: Dell Inspiron 15, iPhone 13 Pro"
                        value={formData.equipamentoModelo}
                        onChange={(e) => setFormData({ ...formData, equipamentoModelo: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="equipamentoProblema">Problema Relatado *</Label>
                    <Textarea
                      id="equipamentoProblema"
                      placeholder="Descreva detalhadamente o problema..."
                      value={formData.equipamentoProblema}
                      onChange={(e) => setFormData({ ...formData, equipamentoProblema: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="equipamentoSenha">Senha do Equipamento</Label>
                      <Input
                        id="equipamentoSenha"
                        placeholder="Senha de acesso (se aplicável)"
                        value={formData.equipamentoSenha}
                        onChange={(e) => setFormData({ ...formData, equipamentoSenha: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acessorios">Acessórios Acompanhantes</Label>
                      <Input
                        id="acessorios"
                        placeholder="Carregador, capa, mouse, etc."
                        value={formData.acessorios}
                        onChange={(e) => setFormData({ ...formData, acessorios: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Detalhes do Serviço */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 border-b pb-2">Detalhes do Serviço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status *</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })} disabled={loadingStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingStatus ? "Carregando..." : "Selecione o status"} />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingStatus ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span className="text-sm">Carregando...</span>
                            </div>
                          ) : statusList.length === 0 ? (
                            <div className="p-2 text-sm text-slate-500 text-center">
                              Nenhum status encontrado
                            </div>
                          ) : (
                            statusList.map((status) => (
                              <SelectItem key={status.id} value={status.nome}>{status.nome}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor do Serviço (R$)</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricaoServico">Descrição do Serviço</Label>
                    <Textarea
                      id="descricaoServico"
                      placeholder="Detalhes do serviço a ser realizado..."
                      value={formData.descricaoServico}
                      onChange={(e) => setFormData({ ...formData, descricaoServico: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="previsaoEntrega">Previsão de Entrega</Label>
                      <Input
                        id="previsaoEntrega"
                        type="date"
                        value={formData.previsaoEntrega}
                        onChange={(e) => setFormData({ ...formData, previsaoEntrega: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="previsaoEntregaHora">Horário</Label>
                      <Input
                        id="previsaoEntregaHora"
                        type="time"
                        value={formData.previsaoEntregaHora}
                        onChange={(e) => setFormData({ ...formData, previsaoEntregaHora: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Terceirização */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 border-b pb-2">Terceirização (Opcional)</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terceirizado"
                      checked={formData.terceirizado}
                      onCheckedChange={(checked) => setFormData({ ...formData, terceirizado: checked as boolean })}
                    />
                    <Label htmlFor="terceirizado">Serviço será terceirizado</Label>
                  </div>

                  {formData.terceirizado && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="servicoTerceirizado">Tipo de Serviço Terceirizado</Label>
                        <Input
                          id="servicoTerceirizado"
                          placeholder="Ex: Conserto de placa, troca de tela"
                          value={formData.servicoTerceirizado}
                          onChange={(e) => setFormData({ ...formData, servicoTerceirizado: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rastreamentoExterno">Código de Rastreamento</Label>
                        <Input
                          id="rastreamentoExterno"
                          placeholder="BR123456789BR"
                          value={formData.rastreamentoExterno}
                          onChange={(e) => setFormData({ ...formData, rastreamentoExterno: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Informações de Pagamento */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 border-b pb-2 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Informações de Pagamento</span>
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="pago"
                      checked={formData.pago}
                      onCheckedChange={(checked) => setFormData({ ...formData, pago: checked as boolean })}
                    />
                    <Label htmlFor="pago">Serviço já foi pago</Label>
                  </div>

                  {formData.pago && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
                        <Select value={formData.formaPagamento} onValueChange={(value) => setFormData({ ...formData, formaPagamento: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {formasPagamento.map((forma) => (
                              <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="valorPago">Valor Pago (R$)</Label>
                        <Input
                          id="valorPago"
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={formData.valorPago}
                          onChange={(e) => setFormData({ ...formData, valorPago: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="temEntrada"
                      checked={!!formData.valorEntrada}
                      onCheckedChange={(checked) => setFormData({ 
                        ...formData, 
                        valorEntrada: checked ? '' : '',
                        formaPagamentoEntrada: checked ? '' : ''
                      })}
                    />
                    <Label htmlFor="temEntrada">Cliente deixou entrada/sinal</Label>
                  </div>

                  {formData.valorEntrada !== '' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="valorEntrada">Valor da Entrada (R$)</Label>
                        <Input
                          id="valorEntrada"
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={formData.valorEntrada}
                          onChange={(e) => setFormData({ ...formData, valorEntrada: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="formaPagamentoEntrada">Forma de Pagamento da Entrada</Label>
                        <Select value={formData.formaPagamentoEntrada} onValueChange={(value) => setFormData({ ...formData, formaPagamentoEntrada: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {formasPagamento.map((forma) => (
                              <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Resumo Financeiro */}
                  {(formData.valor || formData.valorPago || formData.valorEntrada) && (
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-medium text-slate-900">Resumo Financeiro</h4>
                      {formData.valor && (
                        <div className="flex justify-between text-sm">
                          <span>Valor do Serviço:</span>
                          <span className="font-medium">R$ {parseFloat(formData.valor || '0').toFixed(2)}</span>
                        </div>
                      )}
                      {formData.valorPago && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Valor Pago:</span>
                          <span className="font-medium">R$ {parseFloat(formData.valorPago || '0').toFixed(2)}</span>
                        </div>
                      )}
                      {formData.valorEntrada && (
                        <div className="flex justify-between text-sm text-blue-600">
                          <span>Valor de Entrada:</span>
                          <span className="font-medium">R$ {parseFloat(formData.valorEntrada || '0').toFixed(2)}</span>
                        </div>
                      )}
                      {formData.valor && (
                        <div className="flex justify-between text-sm font-medium pt-2 border-t">
                          <span>Saldo Restante:</span>
                          <span className={parseFloat(formData.valor || '0') - (parseFloat(formData.valorPago || '0') + parseFloat(formData.valorEntrada || '0')) > 0 ? "text-orange-600" : "text-green-600"}>
                            R$ {(parseFloat(formData.valor || '0') - (parseFloat(formData.valorPago || '0') + parseFloat(formData.valorEntrada || '0'))).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {editingOS ? 'Atualizar' : 'Criar'} O.S.
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingOS(null)
                      setFormData({
                        clienteNome: '',
                        clienteWhatsapp: '',
                        equipamentoModelo: '',
                        equipamentoProblema: '',
                        equipamentoSenha: '',
                        acessorios: '',
                        categoria: '',
                        status: 'Recebido',
                        terceirizado: false,
                        servicoTerceirizado: '',
                        rastreamentoExterno: '',
                        descricaoServico: '',
                        valor: '',
                        previsaoEntrega: '',
                        previsaoEntregaHora: '',
                        pago: false,
                        valorPago: '',
                        valorEntrada: '',
                        formaPagamento: '',
                        formaPagamentoEntrada: ''
                      })
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">Lion Tech - Ordens de Serviço</h1>
              </div>
            </div>
            
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova O.S.
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar por O.S., cliente ou equipamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card 
            className={`cursor-pointer hover:shadow-md transition-all ${
              statusFilter === 'Todos' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setStatusFilter('Todos')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Total de O.S.</p>
                  <p className="text-xl font-bold text-slate-900">{ordensServico.length}</p>
                </div>
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-md transition-all ${
              statusFilter === 'Em Andamento' ? 'ring-2 ring-orange-500 bg-orange-50' : ''
            }`}
            onClick={() => setStatusFilter('Em Andamento')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Em Andamento</p>
                  <p className="text-xl font-bold text-slate-900">
                    {ordensServico.filter(os => os.status === 'Em Andamento').length}
                  </p>
                </div>
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:shadow-md transition-all ${
              statusFilter === 'Concluído' ? 'ring-2 ring-green-500 bg-green-50' : ''
            }`}
            onClick={() => setStatusFilter('Concluído')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Concluídas</p>
                  <p className="text-xl font-bold text-slate-900">
                    {ordensServico.filter(os => os.status === 'Concluído').length}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Ordens de Serviço</CardTitle>
            <CardDescription>
              {filteredOrdens.length} ordem{filteredOrdens.length !== 1 ? 'ens' : ''} de serviço encontrada{filteredOrdens.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrdens.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {searchTerm ? 'Nenhuma O.S. encontrada' : 'Nenhuma ordem de serviço'}
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm ? 'Tente uma busca diferente' : 'Crie sua primeira ordem de serviço'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar O.S.
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrdens.map((os) => (
                  <div 
                    key={os.id}
                    className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getCategoriaIcon(os.categoria)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-slate-900">{os.numeroOS}</span>
                            <Badge className={getStatusColor(os.status)}>
                              {os.status}
                            </Badge>
                            {os.terceirizado && (
                              <Badge variant="outline" className="text-purple-600 border-purple-600">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Terceirizado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{os.clienteNome} - {os.equipamentoModelo}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePrint(os)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        {os.status !== 'Concluído' && os.status !== 'Entregue' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleFinalizarOS(os.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(os)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(os.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">Problema:</span>
                        <p className="text-slate-600">{os.equipamentoProblema}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Contato:</span>
                        <p className="text-slate-600">{os.clienteWhatsapp}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Previsão:</span>
                        <p className="text-slate-600">
                          {os.previsaoEntrega 
                            ? os.previsaoEntrega.includes('T') 
                              ? new Date(os.previsaoEntrega).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : new Date(os.previsaoEntrega).toLocaleDateString('pt-BR')
                            : 'Não definida'
                          }
                        </p>
                      </div>
                    </div>

                    {(os.equipamentoSenha || os.acessorios || os.valor || os.pago || os.valorPago || os.valorEntrada) && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex flex-wrap gap-4 text-sm">
                          {os.equipamentoSenha && (
                            <div>
                              <span className="font-medium text-slate-700">Senha:</span>
                              <span className="ml-1 text-slate-600">{os.equipamentoSenha}</span>
                            </div>
                          )}
                          {os.acessorios && (
                            <div>
                              <span className="font-medium text-slate-700">Acessórios:</span>
                              <span className="ml-1 text-slate-600">{os.acessorios}</span>
                            </div>
                          )}
                          {os.valor && (
                            <div>
                              <span className="font-medium text-slate-700">Valor:</span>
                              <span className="ml-1 text-slate-600">R$ {os.valor.toFixed(2)}</span>
                            </div>
                          )}
                          {os.pago && os.valorPago && (
                            <div className="flex items-center space-x-1">
                              <CreditCard className="w-3 h-3 text-green-600" />
                              <span className="font-medium text-green-700">Pago:</span>
                              <span className="text-green-600">R$ {os.valorPago.toFixed(2)}</span>
                              {os.formaPagamento && (
                                <span className="text-green-600">({os.formaPagamento})</span>
                              )}
                            </div>
                          )}
                          {os.valorEntrada && (
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-3 h-3 text-blue-600" />
                              <span className="font-medium text-blue-700">Entrada:</span>
                              <span className="text-blue-600">R$ {os.valorEntrada.toFixed(2)}</span>
                              {os.formaPagamentoEntrada && (
                                <span className="text-blue-600">({os.formaPagamentoEntrada})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {os.terceirizado && (os.servicoTerceirizado || os.rastreamentoExterno) && (
                      <div className="mt-3 pt-3 border-t border-slate-200 bg-purple-50 rounded p-2">
                        <div className="flex flex-wrap gap-4 text-sm">
                          {os.servicoTerceirizado && (
                            <div>
                              <span className="font-medium text-purple-700">Serviço Terceirizado:</span>
                              <span className="ml-1 text-purple-600">{os.servicoTerceirizado}</span>
                            </div>
                          )}
                          {os.rastreamentoExterno && (
                            <div>
                              <span className="font-medium text-purple-700">Rastreamento:</span>
                              <span className="ml-1 text-purple-600">{os.rastreamentoExterno}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}