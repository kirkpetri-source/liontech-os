'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { toast } from 'sonner'

interface OrdemServico {
  id: string
  numeroOS: string
  clienteId: string
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

interface Cliente {
  id: string
  nome: string
  whatsapp: string
  createdAt?: string
}

interface OrdensServicoPageProps {
  openNewSignal?: number
}

export default function OrdensServicoPage({ openNewSignal = 0 }: OrdensServicoPageProps) {
  const [showForm, setShowForm] = useState(false)
  useEffect(() => {
    if (openNewSignal) setShowForm(true)
  }, [openNewSignal])
  const [editingOS, setEditingOS] = useState<OrdemServico | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
const [isFilterOpen, setIsFilterOpen] = useState(false)
const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])

const [categorias, setCategorias] = useState<Categoria[]>([])
const [statusList, setStatusList] = useState<Status[]>([])
const [loadingCategorias, setLoadingCategorias] = useState(true)
const [loadingStatus, setLoadingStatus] = useState(true)

// Clientes: busca/seleção/cadastro inline
const [clientes, setClientes] = useState<Cliente[]>([])
const [loadingClientes, setLoadingClientes] = useState(false)
const [clienteBusca, setClienteBusca] = useState('')
const [clienteResultados, setClienteResultados] = useState<Cliente[]>([])
const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
const [showNovoCliente, setShowNovoCliente] = useState(false)
const [novoClienteNome, setNovoClienteNome] = useState('')
const [novoClienteWhatsapp, setNovoClienteWhatsapp] = useState('')
const [salvandoCliente, setSalvandoCliente] = useState(false)

  // Configurações carregadas do backend (empresa e impressão)
  const [empresaCfg, setEmpresaCfg] = useState<{
    nome?: string
    cnpj?: string
    telefone?: string
    email?: string
    endereco?: string
  } | null>(null)

  const [impressaoCfg, setImpressaoCfg] = useState<{
    cabecalhoOrdens?: boolean
    rodapeHabilitado?: boolean
    rodapePersonalizado?: string
    logoUrl?: string
    tamanhoPapel?: string
    codigoBarras?: boolean
  } | null>(null)

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

  // Removidos fallbacks: categorias e status devem refletir exclusivamente o que está configurado

  // Carregar ordens do banco de dados
  useEffect(() => {
    const fetchOrdens = async () => {
      try {
        const response = await fetch('/api/ordens')
        if (response.ok) {
          const data = await response.json()
          setOrdensServico(Array.isArray(data) ? data.sort((a: OrdemServico, b: OrdemServico) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [])
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
          setCategorias(Array.isArray(data) ? data : [])
        } else {
          setCategorias([])
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error)
        setCategorias([])
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
          setStatusList(Array.isArray(data) ? data : [])
        } else {
          setStatusList([])
        }
      } catch (error) {
        console.error('Erro ao buscar status:', error)
        setStatusList([])
      } finally {
        setLoadingStatus(false)
      }
    }

    fetchStatus()
  }, [])

  // Carregar clientes quando abrir o formulário
  useEffect(() => {
    if (!showForm) return
    setLoadingClientes(true)
    fetch('/api/clientes')
      .then(r => r.ok ? r.json() : [])
      .then((data) => {
        setClientes(Array.isArray(data) ? data : [])
        setLoadingClientes(false)
      })
      .catch(() => setLoadingClientes(false))
  }, [showForm])

  // Atualizar resultados de busca de clientes
  useEffect(() => {
    const raw = clienteBusca.trim()
    if (!raw) { setClienteResultados([]); return }

    const q = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const qDigits = raw.replace(/\D/g, '')

    const results = clientes
      .filter((c) => {
        const name = (c.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const phoneDigits = (c.whatsapp || '').replace(/\D/g, '')
        const nameMatch = q.length >= 1 && name.includes(q)
        const phoneMatch = qDigits.length >= 3 && phoneDigits.includes(qDigits)
        return nameMatch || phoneMatch
      })
      .slice(0, 6)
    setClienteResultados(results)
  }, [clienteBusca, clientes])

  // Abrir cadastro automaticamente quando não houver resultados
  useEffect(() => {
    if (clienteSelecionado) return
    const q = clienteBusca.trim()
    if (q && clienteResultados.length === 0) setShowNovoCliente(true)
  }, [clienteBusca, clienteResultados, clienteSelecionado])

  // Carregar configurações gerais (empresa e impressão)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config')
        if (!res.ok) return
        const cfg = await res.json()
        if (cfg?.empresa) setEmpresaCfg(cfg.empresa)
        if (cfg?.impressao) setImpressaoCfg(cfg.impressao)
      } catch (e) {
        console.error('Erro ao buscar configurações gerais:', e)
      }
    }
    fetchConfig()
  }, [])

  // Persistência do filtro de status
  useEffect(() => {
    const saved = localStorage.getItem('osStatusFilter')
    if (saved) setStatusFilter(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('osStatusFilter', statusFilter)
  }, [statusFilter])

  const filteredOrdens = ordensServico.filter(os => {
    const matchesSearch = 
      os.numeroOS.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.equipamentoModelo.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'Todos' ? os.status !== 'Concluído' : os.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handlePrint = (os: OrdemServico) => {
    const moeda = 'R$'
    const empresa = {
      nome: empresaCfg?.nome || 'Lion Tech',
      cnpj: empresaCfg?.cnpj || '',
      telefone: empresaCfg?.telefone || '',
      email: empresaCfg?.email || '',
      endereco: empresaCfg?.endereco || ''
    }
    const imp = {
      cabecalhoOrdens: impressaoCfg?.cabecalhoOrdens !== false,
      rodapeHabilitado: impressaoCfg?.rodapeHabilitado !== false,
      rodapePersonalizado: impressaoCfg?.rodapePersonalizado || '',
      logoUrl: normalizeLogoUrl(impressaoCfg?.logoUrl),
      tamanhoPapel: impressaoCfg?.tamanhoPapel || 'A4',
      codigoBarras: impressaoCfg?.codigoBarras || false
    }

    const statusColor = os.status === 'Concluído' ? '#16a34a' : os.status === 'Em Andamento' ? '#2563eb' : os.status === 'Entregue' ? '#10b981' : '#f59e0b'

    const formatMoney = (v?: number) => typeof v === 'number' ? `${moeda} ${v.toFixed(2)}` : '-'
    const previsao = os.previsaoEntrega
      ? (os.previsaoEntrega.includes('T')
          ? new Date(os.previsaoEntrega).toLocaleString('pt-BR')
          : new Date(os.previsaoEntrega).toLocaleDateString('pt-BR'))
      : 'Não definida'

    const saldo = (os.valor || 0) - (os.valorPago || 0) - (os.valorEntrada || 0)

    const printContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Ordem de Serviço ${os.numeroOS}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
          <style>
            :root { --ink:#0f172a; --muted:#64748b; --accent:#1d4ed8; --line:#e2e8f0; }
            * { box-sizing: border-box; }
            body { font-family: 'Inter', system-ui, -apple-system, Segoe UI, Arial, sans-serif; color: var(--ink); margin: 0; }
            .page { padding: 18mm; }
            .doc { max-width: 210mm; margin: 0 auto; background: white; }
            .header { display: ${imp.cabecalhoOrdens ? 'grid' : 'none'}; grid-template-columns: 1fr auto; gap: 16px; align-items: center; padding-bottom: 12px; border-bottom: 2px solid var(--ink); }
            .brand { display:flex; align-items:center; gap:14px; }
            .logo { width: 96px; height: 96px; object-fit: contain; flex: 0 0 auto; }
            .company { line-height: 1.25; }
            .company-name { font-size: 22px; font-weight: 700; letter-spacing: .2px; }
            .company-info { font-size: 12px; color: var(--muted); margin-top: 2px; }
            .os-meta { text-align: right; }
            .os-title { font-size: 13px; color: var(--muted); margin-bottom: 4px; }
            .os-number { font-size: 22px; font-weight: 700; color: var(--accent); }
            .chip { display:inline-block; padding: 4px 10px; border-radius: 999px; color: white; font-size: 12px; font-weight: 600; background: ${statusColor}; }
            .sections { margin-top: 16px; display: grid; gap: 12px; }
            .section { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
            .section-h { padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid var(--line); font-weight: 700; font-size: 13px; letter-spacing: .2px; }
            .rows { padding: 12px; display: grid; gap: 6px; }
            .row { display: grid; grid-template-columns: max-content 1fr; align-items: baseline; gap: 6px; font-size: 13px; }
            .label { color: var(--muted); font-weight: 600; white-space: nowrap; }
            .value { color: var(--ink); font-weight: 600; }
            .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .money { background: #f8fafc; border: 1px dashed var(--line); border-radius: 8px; padding: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; }
            .sum { font-weight: 700; color: var(--accent); }
            .foot { margin-top: 16px; padding-top: 10px; border-top: 1px solid var(--line); color: var(--muted); font-size: 11px; }
            .divider { margin: 18px 0; border-top: 1px dashed var(--line); }
            @media print {
              .page { padding: 10mm; }
              @page { size: ${imp.tamanhoPapel}; margin: 10mm; }
              .doc { max-width: initial; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="doc">
              <header class="header">
                <div class="brand">
                  <img src="${imp.logoUrl}" class="logo" alt="logo" onerror="this.style.display='none'" />
                  <div class="company">
                    <div class="company-name">${empresa.nome}</div>
                    <div class="company-info">${empresa.endereco || ''}</div>
                    <div class="company-info">${empresa.telefone || ''}${empresa.email ? ' • ' + empresa.email : ''}</div>
                    <div class="company-info">${empresa.cnpj ? 'CNPJ: ' + empresa.cnpj : ''}</div>
                  </div>
                </div>
                <div class="os-meta">
                  <div class="os-title">Ordem de Serviço</div>
                  <div class="os-number">${os.numeroOS}</div>
                  <div style="margin-top:8px"><span class="chip">${os.status}</span></div>
                </div>
              </header>

              <main class="sections">
                <section class="section">
                  <div class="section-h">Dados do Cliente</div>
                  <div class="rows grid2">
                    <div>
                      <div class="row"><div class="label">Nome</div><div class="value">${os.clienteNome}</div></div>
                    </div>
                    <div>
                      <div class="row"><div class="label">WhatsApp</div><div class="value">${os.clienteWhatsapp}</div></div>
                    </div>
                  </div>
                </section>

                <section class="section">
                  <div class="section-h">Equipamento</div>
                  <div class="rows">
                    <div class="row"><div class="label">Categoria</div><div class="value">${os.categoria}</div></div>
                    <div class="row"><div class="label">Modelo</div><div class="value">${os.equipamentoModelo}</div></div>
                    <div class="row"><div class="label">Problema</div><div class="value">${os.equipamentoProblema}</div></div>
                    ${os.acessorios ? `<div class="row"><div class="label">Acessórios</div><div class="value">${os.acessorios}</div></div>` : ''}
                    ${os.equipamentoSenha ? `<div class="row"><div class="label">Senha</div><div class="value">${os.equipamentoSenha}</div></div>` : ''}
                  </div>
                </section>

                <section class="section">
                  <div class="section-h">Serviço</div>
                  <div class="rows">
                    <div class="row"><div class="label">Previsão</div><div class="value">${previsao}</div></div>
                    ${os.descricaoServico ? `<div class="row"><div class="label">Descrição</div><div class="value">${os.descricaoServico}</div></div>` : ''}
                    ${os.terceirizado ? `<div class="row"><div class="label">Terceirizado</div><div class="value">${os.servicoTerceirizado || '—'}</div></div>` : ''}
                    ${os.rastreamentoExterno ? `<div class="row"><div class="label">Rastreamento</div><div class="value">${os.rastreamentoExterno}</div></div>` : ''}
                  </div>
                </section>

                ${(typeof os.valor === 'number' || typeof os.valorEntrada === 'number' || typeof os.valorPago === 'number') ? `
                <section class="section">
                  <div class="section-h">Valores</div>
                  <div class="rows">
                    <div class="money">
                      <div><span class="label">Valor Total</span><div class="value">${formatMoney(os.valor)}</div></div>
                      <div><span class="label">Entrada</span><div class="value">${formatMoney(os.valorEntrada)}</div></div>
                      <div><span class="label">Pago</span><div class="value">${formatMoney(os.valorPago)}${os.formaPagamento ? ` (${os.formaPagamento})` : ''}</div></div>
                      <div><span class="label">Saldo</span><div class="value sum">${formatMoney(saldo)}</div></div>
                    </div>
                  </div>
                </section>` : ''}

                <div class="rows" style="padding-top:0">
                  <div class="row"><div class="label">Criada em</div><div class="value">${new Date(os.createdAt).toLocaleString('pt-BR')}</div></div>
                </div>

                ${imp.rodapeHabilitado || imp.rodapePersonalizado ? `
                <div class="foot">
                  ${imp.rodapePersonalizado || 'Obrigado pela preferência. Garantia de serviços conforme condições acordadas.'}
                </div>` : ''}

              </main>
            </div>
          </div>
          <script>
            window.onload = () => setTimeout(() => window.print(), 200)
          </script>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  const handleSalvarNovoCliente = async () => {
  if (!novoClienteNome.trim()) { toast.error('Informe o nome do cliente.'); return }
  if (!isValidWhatsapp(novoClienteWhatsapp)) { toast.error('Informe um WhatsApp válido (10 ou 11 dígitos).'); return }
  try {
    setSalvandoCliente(true)
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoClienteNome, whatsapp: maskWhatsapp(novoClienteWhatsapp) }),
    })
    if (res.ok) {
      const created = await res.json()
      setClientes([created, ...clientes])
      setClienteSelecionado(created)
      setFormData({ ...formData, clienteNome: created.nome, clienteWhatsapp: created.whatsapp })
      setShowNovoCliente(false)
      setNovoClienteNome('')
      setNovoClienteWhatsapp('')
      setClienteBusca(created.nome)
      setClienteResultados([])
      toast.success('Cliente cadastrado e selecionado.')
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err?.error || 'Falha ao cadastrar cliente.')
    }
  } catch (e) {
    console.error('Erro ao cadastrar cliente:', e)
    toast.error('Erro ao cadastrar cliente.')
  } finally {
    setSalvandoCliente(false)
  }
}

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clienteSelecionado) {
      toast.error('Selecione ou cadastre um cliente antes de criar a O.S.')
      return
    }

    if (!isValidWhatsapp(formData.clienteWhatsapp)) {
      toast.error('Informe um WhatsApp válido (10 ou 11 dígitos).')
      return
    }

    const numeroOS = editingOS ? editingOS.numeroOS : `OS-${String(ordensServico.length + 1).padStart(3, '0')}`

    const formattedData = {
      clienteId: clienteSelecionado.id,
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
      valor: formData.valor ? parseCurrencyBRLToNumber(formData.valor) : undefined,
      previsaoEntrega: formData.previsaoEntrega && formData.previsaoEntregaHora 
        ? `${formData.previsaoEntrega}T${formData.previsaoEntregaHora}`
        : formData.previsaoEntrega,
      pago: formData.pago,
      valorPago: formData.valorPago ? parseCurrencyBRLToNumber(formData.valorPago) : undefined,
      valorEntrada: formData.valorEntrada ? parseCurrencyBRLToNumber(formData.valorEntrada) : undefined,
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
        } else {
          const err = await res.json().catch(() => ({}))
          toast.error(err?.error || 'Falha ao criar O.S. Verifique o cliente selecionado.')
        }
      }
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço:', error)
      toast.error('Erro ao salvar ordem de serviço')
    }

    setFormData({
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

  // Normaliza número de WhatsApp para padrão aceito pelo wa.me (E.164 BR)
  const normalizeWhatsapp = (raw: string) => {
    const digits = (raw || '').replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('55')) return digits
    if (digits.length >= 10 && digits.length <= 11) return '55' + digits
    return digits
  }

  const maskWhatsapp = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0,11)
    const d = digits
    if (d.length <= 2) return d ? `(${d}` : ''
    if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`
  }

  const isValidWhatsapp = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits.length === 10 || digits.length === 11
  }

  // Formata entrada como moeda BRL
  const maskCurrencyBRL = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    const cents = digits.slice(-2).padStart(2, '0')
    let integer = digits.slice(0, -2).replace(/^0+(?=\d)/g, '')
    if (!integer) integer = '0'
    const intFormatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${intFormatted},${cents}`
  }

  // Converte string BRL para número
  const parseCurrencyBRLToNumber = (value: string) => {
    if (!value) return undefined
    const normalized = value.replace(/\./g, '').replace(',', '.')
    const num = parseFloat(normalized)
    return isNaN(num) ? undefined : num
  }

  const formatBRL = (v?: number) => typeof v === 'number' 
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
    : undefined

  const buildWhatsAppMessage = (os: OrdemServico) => {
    const previsao = os.previsaoEntrega
      ? (os.previsaoEntrega.includes('T')
          ? new Date(os.previsaoEntrega).toLocaleString('pt-BR')
          : new Date(os.previsaoEntrega).toLocaleDateString('pt-BR'))
      : 'Não definida'
    const total = typeof os.valor === 'number' ? formatBRL(os.valor) : undefined
    const entrada = typeof os.valorEntrada === 'number' ? formatBRL(os.valorEntrada) : undefined
    const pago = typeof os.valorPago === 'number' ? formatBRL(os.valorPago) : undefined
    const saldo = (os.valor || 0) - (os.valorPago || 0) - (os.valorEntrada || 0)
    const saldoBRL = formatBRL(saldo)
    const partesValores = [
      total ? `Valor: ${total}` : null,
      entrada ? `Entrada: ${entrada}` : null,
      pago ? `Pago: ${pago}` : null,
      saldoBRL ? `Saldo: ${saldoBRL}` : null
    ].filter(Boolean).join(' | ')
    return [
      `Olá ${os.clienteNome}, aqui é da Lion Tech.`,
      `Sua O.S. ${os.numeroOS} está com status: ${os.status}.`,
      `Equipamento: ${os.equipamentoModelo}`,
      `Problema: ${os.equipamentoProblema}`,
      `Previsão: ${previsao}`,
      partesValores ? partesValores : ''
    ].filter(Boolean).join('\n')
  }

  const handleSendWhatsApp = async (os: OrdemServico) => {
    try {
      const loadingId = (toast as any).loading ? (toast as any).loading('Enviando link da O.S. via WhatsApp (Cloud)...') : null

      const endpoint = '/api/whatsapp/send'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ osId: os.id, mode: 'link' })
      })

      if (!res.ok) {
        let msg = 'Falha ao enviar pelo WhatsApp (Cloud)'
        let code: number | null = null
        try {
          const err = await res.json()
          const parts = [err?.error, err?.message, err?.code ? `code ${err.code}` : null].filter(Boolean)
          if (parts.length) msg = parts.join(' - ')
          if (typeof err?.code === 'number') code = err.code
        } catch {}

        // Fallback automático para WhatsApp Web quando Cloud API está indisponível ou não onboarded
        const shouldFallback = res.status === 401 || res.status === 403 || code === 133010 || code === 10 || code === 190
        if (shouldFallback) {
          if (loadingId) (toast as any).dismiss?.(loadingId)
          const loadingWebId = (toast as any).loading ? (toast as any).loading('Cloud falhou. Tentando via WhatsApp Web...') : null
          try {
            const webRes = await fetch('/api/whatsapp-web/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ osId: os.id, mode: 'link' })
            })
            if (webRes.ok) {
              toast.success('Enviado via WhatsApp Web!')
            } else {
              let webMsg = 'Falha ao enviar pelo WhatsApp Web'
              try {
                const werr = await webRes.json()
                const parts = [werr?.error, werr?.state].filter(Boolean)
                if (parts.length) webMsg = parts.join(' - ')
              } catch {}
              toast.error(webMsg)
            }
          } catch (e) {
            toast.error('Erro ao enviar pelo WhatsApp Web')
          } finally {
            if (loadingWebId) (toast as any).dismiss?.(loadingWebId)
          }
        } else {
          toast.error(msg)
        }
      } else {
        toast.success('Enviado via WhatsApp (Cloud)!')
      }

      if ((toast as any).dismiss && loadingId) (toast as any).dismiss(loadingId)
    } catch (e) {
      toast.error('Erro ao enviar pelo WhatsApp (Cloud)')
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
              <div className="flex flex-wrap items-center justify-between gap-2">
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
                  <div className="space-y-3">
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar cliente por nome ou WhatsApp..."
                          value={clienteBusca}
                          onChange={(e) => setClienteBusca(e.target.value)}
                          className="pl-10"
                          disabled={loadingClientes}
                        />
                        {clienteResultados.length > 0 && (
                          <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-md shadow-sm">
                            {clienteResultados.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                                onClick={() => {
                                  setClienteSelecionado(c)
                                  setFormData({ ...formData, clienteNome: c.nome, clienteWhatsapp: maskWhatsapp(c.whatsapp) })
                                  setClienteBusca(c.nome)
                                  setClienteResultados([])
                                }}
                              >
                                <span className="font-medium">{c.nome}</span>
                                <span className="text-slate-500 text-sm">{maskWhatsapp(c.whatsapp)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button type="button" variant={showNovoCliente ? 'default' : 'outline'} onClick={() => setShowNovoCliente((v) => !v)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {showNovoCliente ? 'Cancelar' : 'Novo Cliente'}
                      </Button>
                    </div>
                    {clienteBusca.trim() && clienteResultados.length === 0 && !clienteSelecionado && !loadingClientes && !showNovoCliente && (
                      <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md px-3 py-2" role="alert" aria-live="polite">
                         <AlertCircle className="w-4 h-4" />
                         <span>Nenhum cliente encontrado. Este cliente não está cadastrado. Clique em “Novo Cliente” para cadastrar e continuar.</span>
                         <Button type="button" size="sm" className="ml-auto" onClick={() => setShowNovoCliente(true)}>
                           <Plus className="w-4 h-4 mr-1" /> Cadastrar Cliente
                         </Button>
                       </div>
                    )}
                    {showNovoCliente && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="novoClienteNome">Nome *</Label>
                          <Input
                            id="novoClienteNome"
                            placeholder="Digite o nome do cliente"
                            value={novoClienteNome}
                            onChange={(e) => setNovoClienteNome(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="novoClienteWhatsapp">WhatsApp *</Label>
                          <Input
                            id="novoClienteWhatsapp"
                            type="tel"
                            placeholder="(00) 00000-0000"
                            value={novoClienteWhatsapp}
                            onChange={(e) => setNovoClienteWhatsapp(maskWhatsapp(e.target.value))}
                            inputMode="numeric"
                            autoComplete="tel"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button type="button" onClick={handleSalvarNovoCliente} disabled={salvandoCliente}>
                            {salvandoCliente ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" /> }
                            Salvar e selecionar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {clienteSelecionado && !showNovoCliente && (
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md px-3 py-2 mb-2" role="status" aria-live="polite">
                      <AlertCircle className="w-4 h-4" />
                      <span>Cliente selecionado. Nome e WhatsApp ficam bloqueados aqui; edite na tela de Clientes.</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clienteNome">Nome do Cliente *</Label>
                      <Input
                        id="clienteNome"
                        placeholder="Nome completo do cliente"
                        value={formData.clienteNome}
                        onChange={!clienteSelecionado ? (e) => setFormData({ ...formData, clienteNome: e.target.value }) : undefined}
                        readOnly={!!clienteSelecionado}
                        aria-readonly={!!clienteSelecionado}
                        className={clienteSelecionado ? 'bg-yellow-50 cursor-not-allowed' : undefined}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clienteWhatsapp">WhatsApp *</Label>
                      <Input
                        id="clienteWhatsapp"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={formData.clienteWhatsapp}
                        onChange={!clienteSelecionado ? (e) => setFormData({ ...formData, clienteWhatsapp: maskWhatsapp(e.target.value) }) : undefined}
                        readOnly={!!clienteSelecionado}
                        aria-readonly={!!clienteSelecionado}
                        inputMode="numeric"
                        autoComplete="tel"
                        className={clienteSelecionado ? 'bg-yellow-50 cursor-not-allowed' : undefined}
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
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: maskCurrencyBRL(e.target.value) })}
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
                    <Label htmlFor="pago">Entrada/Pagamento</Label>
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
                          type="text"
                          inputMode="numeric"
                          placeholder="0,00"
                          value={formData.valorPago}
                          onChange={(e) => setFormData({ ...formData, valorPago: maskCurrencyBRL(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Toggle de entrada removido conforme solicitação */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="valorEntrada">Valor da Entrada (R$)</Label>
                        <Input
                          id="valorEntrada"
                          type="text"
                          inputMode="numeric"
                          placeholder="0,00"
                          value={formData.valorEntrada}
                          onChange={(e) => setFormData({ ...formData, valorEntrada: maskCurrencyBRL(e.target.value) })}
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

                  {/* Resumo Financeiro */}
                  {(formData.valor || formData.valorPago || formData.valorEntrada) && (
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-medium text-slate-900">Resumo Financeiro</h4>
                      {formData.valor && (
                        <div className="flex justify-between text-sm">
                          <span>Valor do Serviço:</span>
                          <span className="font-medium">R$ {(parseCurrencyBRLToNumber(formData.valor || '') || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {formData.valorPago && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Valor Pago:</span>
                          <span className="font-medium">R$ {(parseCurrencyBRLToNumber(formData.valorPago || '') || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {formData.valorEntrada && (
                        <div className="flex justify-between text-sm text-blue-600">
                          <span>Valor de Entrada:</span>
                          <span className="font-medium">R$ {(parseCurrencyBRLToNumber(formData.valorEntrada || '') || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {formData.valor && (
                        <div className="flex justify-between text-sm font-medium pt-2 border-t">
                          <span>Saldo Restante:</span>
                          <span className={( (parseCurrencyBRLToNumber(formData.valor || '') || 0) - ((parseCurrencyBRLToNumber(formData.valorPago || '') || 0) + (parseCurrencyBRLToNumber(formData.valorEntrada || '') || 0)) ) > 0 ? "text-orange-600" : "text-green-600"}>
                            R$ {(((parseCurrencyBRLToNumber(formData.valor || '') || 0) - ((parseCurrencyBRLToNumber(formData.valorPago || '') || 0) + (parseCurrencyBRLToNumber(formData.valorEntrada || '') || 0)))).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={!clienteSelecionado}>
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
          <div className="flex flex-wrap items-center justify-between gap-2 h-auto py-2 sm:h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">Lion Tech - Ordens de Serviço</h1>
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
          <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Atalhos de Status */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={statusFilter === 'Todos' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('Todos')}
          >
            Todos (oculta Concluídos)
          </Button>
          {statusList.map((s) => (
            <Button
              key={s.id}
              variant={statusFilter === s.nome ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s.nome)}
            >
              {s.nome}
            </Button>
          ))}
        </div>

        {/* Dialogo de Filtros */}
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filtros</DialogTitle>
              <DialogDescription>Selecione os critérios para filtrar as O.S.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    {statusList.map((s) => (
                      <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setStatusFilter('Todos'); }}>Limpar</Button>
              <Button onClick={() => setIsFilterOpen(false)}>Aplicar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Removidos cards de estatísticas da lista; filtros permanecem no diálogo */}

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
                    className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getCategoriaIcon(os.categoria)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
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
                          <p className="text-sm text-slate-600 break-words sm:truncate sm:max-w-[60ch]">{os.clienteNome} - {os.equipamentoModelo}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handlePrint(os)}
                          aria-label="Imprimir O.S."
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleSendWhatsApp(os)}
                          aria-label="Enviar WhatsApp"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                        {os.status !== 'Concluído' && os.status !== 'Entregue' && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleFinalizarOS(os.id)}
                            aria-label="Finalizar O.S."
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEdit(os)}
                          aria-label="Editar O.S."
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDelete(os.id)}
                          aria-label="Excluir O.S."
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

const normalizeLogoUrl = (url?: string) => {
  const u = (url || '').trim()
  if (!u) return '/logo.svg'
  if (/^(https?:\/\/|data:)/.test(u) || u.startsWith('/')) return u
  return `/uploads/logos/${u}`
}