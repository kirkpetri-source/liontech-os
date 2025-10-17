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

  // Removido indicador de prioridade (não há campo correspondente nas O.S.)

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
                <h1 className="text-xl font-bold text-slate-900">Lion Tech</h1>
              </div>
              <span className="text-sm text-slate-500 hidden sm:inline">Sistema de Gestão</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Bem-vindo, {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Buscar
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
          <div className="flex space-x-8">
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
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500">Gráficos de serviços realizados</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Faturamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500">Análise de faturamento mensal</p>
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
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-slate-600">© 2024 Lion Tech. Todos os direitos reservados.</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-slate-500">
              <div className="flex items-center space-x-1">
                <Phone className="w-4 h-4" />
                <span>(11) 9999-9999</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span>contato@liontech.com.br</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>São Paulo - SP</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}