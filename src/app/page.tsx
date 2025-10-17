'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { LoginPage } from '@/components/LoginPage'
import { 
  Users, 
  Wrench, 
  BarChart3, 
  Plus, 
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Laptop,
  Smartphone,
  Monitor,
  Settings,
  LogOut
} from 'lucide-react'

// Componente de Clientes
import ClientesPage from '@/components/ClientesPage'
// Componente de Ordens de Serviço
import OrdensServicoPage from '@/components/OrdensServicoPage'
// Componente de Formulário de O.S.
import OSForm from '@/components/OSForm'
// Componente de Configurações
import ConfiguracoesPage from '@/components/ConfiguracoesPage'

export default function Home() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showOSForm, setShowOSForm] = useState(false)

  // Dados dinâmicos
  const [ordens, setOrdens] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  // Config para rodapé dinâmico
  const [empresaCfg, setEmpresaCfg] = useState({ nome: '', telefone: '', email: '', endereco: '' })
  const [sistemaCfg, setSistemaCfg] = useState<{ rodapeLinks?: { label?: string; url?: string }[] }>({ rodapeLinks: [] })
  const [impressaoCfg, setImpressaoCfg] = useState({ rodapePersonalizado: '', rodapeHabilitado: true })

  useEffect(() => {
    const load = async () => {
      try {
        const [oRes, cRes] = await Promise.all([
          fetch('/api/ordens'),
          fetch('/api/clientes'),
        ])
        if (oRes.ok) setOrdens(await oRes.json())
        if (cRes.ok) setClientes(await cRes.json())
      } catch (err) {
        console.error('Falha ao carregar dashboard:', err)
      }
    }
    load()
  }, [])
  // Carregar configurações para rodapé
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config')
        if (res.ok) {
          const cfg = await res.json()
          setEmpresaCfg({
            nome: cfg?.empresa?.nome || '',
            telefone: cfg?.empresa?.telefone || '',
            email: cfg?.empresa?.email || '',
            endereco: cfg?.empresa?.endereco || '',
          })
          setSistemaCfg({
            rodapeLinks: Array.isArray(cfg?.sistema?.rodapeLinks) ? cfg.sistema.rodapeLinks : []
          })
          setImpressaoCfg({
            rodapePersonalizado: cfg?.impressao?.rodapePersonalizado || '',
            rodapeHabilitado: cfg?.impressao?.rodapeHabilitado ?? true,
          })
        }
      } catch (e) {
        console.error('Falha ao carregar config:', e)
      }
    }
    fetchConfig()
  }, [])

  // Se não estiver autenticado, mostrar página de login
  if (!user) {
    return <LoginPage />
  }

  // Cálculos básicos com base nas ordens carregadas
  const todayStr = new Date().toISOString().split('T')[0]
  const reparosHoje = ordens.filter((os) => {
    if (!os.previsaoEntrega) return false
    const v = String(os.previsaoEntrega)
    const dateOnly = v.includes('T') ? new Date(v).toISOString().split('T')[0] : v
    return dateOnly === todayStr
  }).length
  const pendentes = ordens.filter((os) => !['Concluído','Entregue','Cancelado'].includes(os.status)).length

  const statsCards = [
    { title: 'Ordens de Serviço', value: String(ordens.length), icon: Wrench, color: 'text-blue-600' },
    { title: 'Clientes Ativos', value: String(clientes.length), icon: Users, color: 'text-green-600' },
    { title: 'Consertos Hoje', value: String(reparosHoje), icon: CheckCircle, color: 'text-emerald-600' },
    { title: 'Pendentes', value: String(pendentes), icon: AlertCircle, color: 'text-orange-600' },
  ]

  const servicosRecentes = ordens.slice(0, 3).map((os) => ({
    id: os.numeroOS,
    cliente: os.clienteNome,
    equipamento: os.equipamentoModelo,
    problema: os.equipamentoProblema,
    status: os.status,
  }))

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Concluído": return "bg-green-100 text-green-800"
      case "Em Andamento": return "bg-blue-100 text-blue-800"
      case "Aguardando Peça": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // ===== Relatórios e Analytics (dados reais) =====
  const parseDate = (d: string) => new Date(d.includes('T') ? d : `${d}T00:00:00`)
  const toBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const lastMonths = Array.from({ length: 6 }, (_, i) => {
    const dt = new Date(); dt.setMonth(dt.getMonth() - i)
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
    const label = dt.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    return { key, label }
  }).reverse()

  const byMonth = lastMonths.map((m) => {
    const filtered = ordens.filter((os) => {
      const dt = parseDate(String(os.createdAt))
      const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      return k === m.key
    })
    const count = filtered.length
    const pagos = filtered.filter((os) => os.pago).length
    const receita = filtered.reduce((sum, os) => sum + (os.valorPago || 0) + (os.valorEntrada || 0), 0)
    return { ...m, count, pagos, receita }
  })

  const receitaTotal6m = byMonth.reduce((s, m) => s + m.receita, 0)
  const receitaAtual = byMonth[byMonth.length - 1]?.receita || 0
  const receitaAnterior = byMonth[byMonth.length - 2]?.receita || 0

  // Removido indicador de prioridade (não há campo correspondente nas O.S.)

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 h-auto py-2 sm:h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">Lion Tech</h1>
              </div>
              <span className="text-sm text-slate-500 hidden sm:inline">Sistema de Gestão</span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="text-sm text-slate-600 hidden sm:inline">
                Bem-vindo, {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Buscar</span>
              </Button>
              <Button size="sm" onClick={() => setShowOSForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova O.S.
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0 space-x-4 sm:space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'clientes', label: 'Clientes', icon: Users },
              { id: 'ordens', label: 'Ordens de Serviço', icon: Wrench },
              { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
              { id: 'configuracoes', label: 'Configurações', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showOSForm ? (
          <OSForm 
            onClose={() => setShowOSForm(false)}
            onSave={async (os) => {
              try {
                const res = await fetch('/api/ordens', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    numeroOS: os.numeroOS,
                    clienteNome: os.clienteNome,
                    clienteWhatsapp: os.clienteWhatsapp,
                    equipamentoModelo: os.equipamentoModelo,
                    equipamentoProblema: os.equipamentoProblema,
                    equipamentoSenha: os.equipamentoSenha,
                    acessorios: os.acessorios,
                    categoria: os.categoria,
                    status: os.status || 'Recebido',
                    terceirizado: os.terceirizado,
                    servicoTerceirizado: os.servicoTerceirizado,
                    rastreamentoExterno: os.rastreamentoExterno,
                    descricaoServico: os.descricaoServico,
                    valor: os.valor,
                    previsaoEntrega: os.previsaoEntrega,
                    pago: os.pago,
                    valorPago: os.valorPago,
                    valorEntrada: os.valorEntrada,
                    formaPagamento: os.formaPagamento,
                    formaPagamentoEntrada: os.formaPagamentoEntrada,
                  }),
                })
                if (res.ok) {
                  setShowOSForm(false)
                  setActiveTab('ordens')
                } else {
                  console.error('Falha ao criar O.S.:', await res.text())
                }
              } catch (error) {
                console.error('Erro ao criar O.S.:', error)
              }
            }}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Lion Tech System</h2>
                  <p className="text-blue-100">Gerencie seus serviços de forma eficiente e profissional</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsCards.map((stat, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                          {stat.title}
                        </CardTitle>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                        {/* Removido comparativo vs mês anterior para evitar dados fictícios */}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Recent Services */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Serviços Recentes</span>
                        <Button variant="outline" size="sm" onClick={() => setActiveTab('ordens')}>Ver todos</Button>
                      </CardTitle>
                      <CardDescription>Últimas ordens de serviço registradas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {servicosRecentes.map((servico, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-slate-900">{servico.id}</span>
                                <Badge className={getStatusColor(servico.status)}>
                                  {servico.status}
                                </Badge>
                                {/* Indicador de prioridade removido */}
                              </div>
                              <p className="text-sm text-slate-600">{servico.cliente} - {servico.equipamento}</p>
                              <p className="text-xs text-slate-500">{servico.problema}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Ações Rápidas</CardTitle>
                      <CardDescription>Acessos rápidos para as principais funções</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <Button className="h-20 flex-col space-y-2" onClick={() => setShowOSForm(true)}>
                          <Plus className="w-6 h-6" />
                          <span>Nova O.S.</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('clientes')}>
                          <Users className="w-6 h-6" />
                          <span>Novo Cliente</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('ordens')}>
                          <Laptop className="w-6 h-6" />
                          <span>Computadores</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => setActiveTab('ordens')}>
                          <Smartphone className="w-6 h-6" />
                          <span>Celulares</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'clientes' && <ClientesPage />}

            {activeTab === 'ordens' && <OrdensServicoPage />}

            {activeTab === 'relatorios' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Relatórios e Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Serviços por Período</CardTitle>
                      <CardDescription>Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {byMonth.map((m) => (
                          <div key={m.key} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{m.label}</span>
                            <div className="flex items-center gap-4">
                              <span className="font-medium">Serviços: {m.count}</span>
                              <Badge variant="outline" className="text-emerald-700 border-emerald-200">Pagos: {m.pagos}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Faturamento</CardTitle>
                      <CardDescription>Receita de entradas e pagamentos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-3 rounded-lg bg-blue-50">
                            <div className="text-xs text-slate-500">Mês atual</div>
                            <div className="text-lg font-bold text-slate-900">{toBRL(receitaAtual)}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-50">
                            <div className="text-xs text-slate-500">Mês anterior</div>
                            <div className="text-lg font-bold text-slate-900">{toBRL(receitaAnterior)}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-50">
                            <div className="text-xs text-slate-500">Total (6 meses)</div>
                            <div className="text-lg font-bold text-slate-900">{toBRL(receitaTotal6m)}</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {byMonth.map((m) => (
                            <div key={m.key} className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">{m.label}</span>
                              <span className="font-medium">{toBRL(m.receita)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'configuracoes' && <ConfiguracoesPage />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-slate-600">
                © {new Date().getFullYear()} {empresaCfg.nome || 'Lion Tech'}. {impressaoCfg.rodapePersonalizado || 'Todos os direitos reservados.'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              {empresaCfg.telefone && (
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{empresaCfg.telefone}</span>
                </div>
              )}
              {empresaCfg.email && (
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>{empresaCfg.email}</span>
                </div>
              )}
              {empresaCfg.endereco && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{empresaCfg.endereco}</span>
                </div>
              )}
              {(sistemaCfg.rodapeLinks || []).filter((l) => (l?.label || l?.url)).map((ln, idx) => (
                <a
                  key={idx}
                  href={ln.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-600"
                >
                  {ln.label || ln.url}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}