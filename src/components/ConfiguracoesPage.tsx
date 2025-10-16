'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { 
  Users, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Shield,
  UserPlus,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Save,
  Key,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
  Printer,
  Database,
  Bell,
  Eye,
  EyeOff
} from 'lucide-react'

interface Usuario {
  id: string
  nome: string
  email: string
  cargo: string
  nivel: 'admin' | 'gerente' | 'tecnico' | 'recepcao'
  status: 'ativo' | 'inativo'
  dataCriacao: string
  ultimoAcesso: string
}

interface Categoria {
  id: string
  nome: string
  descricao: string
  cor: string
  ativa: boolean
  quantidadeOS: number
}

interface Status {
  id: string
  nome: string
  descricao: string
  tipo: 'inicial' | 'andamento' | 'final' | 'cancelado'
  cor: string
  padrao: boolean
  ordem: number
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('usuarios')
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null)
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Dados mockados
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    {
      id: '1',
      nome: 'Administrador',
      email: 'admin@liontech.com.br',
      cargo: 'Administrador',
      nivel: 'admin',
      status: 'ativo',
      dataCriacao: '01/01/2024',
      ultimoAcesso: 'Hoje, 14:30'
    },
    {
      id: '2',
      nome: 'João Silva',
      email: 'joao@liontech.com.br',
      cargo: 'Técnico Senior',
      nivel: 'tecnico',
      status: 'ativo',
      dataCriacao: '15/01/2024',
      ultimoAcesso: 'Hoje, 11:20'
    },
    {
      id: '3',
      nome: 'Maria Santos',
      email: 'maria@liontech.com.br',
      cargo: 'Recepcionista',
      nivel: 'recepcao',
      status: 'ativo',
      dataCriacao: '20/01/2024',
      ultimoAcesso: 'Ontem, 16:45'
    }
  ])

  const [categorias, setCategorias] = useState<Categoria[]>([
    {
      id: '1',
      nome: 'Notebooks',
      descricao: 'Serviços para notebooks e laptops',
      cor: '#3B82F6',
      ativa: true,
      quantidadeOS: 45
    },
    {
      id: '2',
      nome: 'Smartphones',
      descricao: 'Reparos em celulares e smartphones',
      cor: '#10B981',
      ativa: true,
      quantidadeOS: 67
    },
    {
      id: '3',
      nome: 'Desktops',
      descricao: 'Manutenção em computadores de mesa',
      cor: '#F59E0B',
      ativa: true,
      quantidadeOS: 23
    },
    {
      id: '4',
      nome: 'Tablets',
      descricao: 'Serviços para tablets',
      cor: '#8B5CF6',
      ativa: false,
      quantidadeOS: 0
    }
  ])

  const [statusList, setStatusList] = useState<Status[]>([
    {
      id: '1',
      nome: 'Aguardando Orçamento',
      descricao: 'Aguardando aprovação do orçamento pelo cliente',
      tipo: 'inicial',
      cor: '#F59E0B',
      padrao: true,
      ordem: 1
    },
    {
      id: '2',
      nome: 'Em Andamento',
      descricao: 'Serviço sendo executado',
      tipo: 'andamento',
      cor: '#3B82F6',
      padrao: true,
      ordem: 2
    },
    {
      id: '3',
      nome: 'Aguardando Peça',
      descricao: 'Aguardando chegada de peça',
      tipo: 'andamento',
      cor: '#8B5CF6',
      padrao: true,
      ordem: 3
    },
    {
      id: '4',
      nome: 'Concluído',
      descricao: 'Serviço finalizado com sucesso',
      tipo: 'final',
      cor: '#10B981',
      padrao: true,
      ordem: 4
    },
    {
      id: '5',
      nome: 'Cancelado',
      descricao: 'Serviço cancelado',
      tipo: 'cancelado',
      cor: '#EF4444',
      padrao: true,
      ordem: 5
    }
  ])

  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    senha: '',
    cargo: '',
    nivel: 'tecnico' as const,
    status: 'ativo' as const
  })

  const [novaCategoria, setNovaCategoria] = useState({
    nome: '',
    descricao: '',
    cor: '#3B82F6',
    ativa: true
  })

  const [novoStatus, setNovoStatus] = useState({
    nome: '',
    descricao: '',
    tipo: 'andamento' as const,
    cor: '#3B82F6',
    padrao: false,
    ordem: 1
  })

  const getNivelColor = (nivel: string) => {
    switch(nivel) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'gerente': return 'bg-purple-100 text-purple-800'
      case 'tecnico': return 'bg-blue-100 text-blue-800'
      case 'recepcao': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch(tipo) {
      case 'inicial': return 'bg-yellow-100 text-yellow-800'
      case 'andamento': return 'bg-blue-100 text-blue-800'
      case 'final': return 'bg-green-100 text-green-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSaveUser = () => {
    if (editingUser) {
      setUsuarios(usuarios.map(u => u.id === editingUser.id ? { ...editingUser, ...novoUsuario } : u))
    } else {
      const newUser: Usuario = {
        id: Date.now().toString(),
        ...novoUsuario,
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
        ultimoAcesso: 'Nunca'
      }
      setUsuarios([...usuarios, newUser])
    }
    setShowUserDialog(false)
    setEditingUser(null)
    setNovoUsuario({
      nome: '',
      email: '',
      senha: '',
      cargo: '',
      nivel: 'tecnico',
      status: 'ativo'
    })
  }

  const handleSaveCategory = () => {
    if (editingCategory) {
      setCategorias(categorias.map(c => c.id === editingCategory.id ? { ...editingCategory, ...novaCategoria } : c))
    } else {
      const newCategory: Categoria = {
        id: Date.now().toString(),
        ...novaCategoria,
        quantidadeOS: 0
      }
      setCategorias([...categorias, newCategory])
    }
    setShowCategoryDialog(false)
    setEditingCategory(null)
    setNovaCategoria({
      nome: '',
      descricao: '',
      cor: '#3B82F6',
      ativa: true
    })
  }

  const handleSaveStatus = () => {
    if (editingStatus) {
      setStatusList(statusList.map(s => s.id === editingStatus.id ? { ...editingStatus, ...novoStatus } : s))
    } else {
      const newStatus: Status = {
        id: Date.now().toString(),
        ...novoStatus
      }
      setStatusList([...statusList, newStatus])
    }
    setShowStatusDialog(false)
    setEditingStatus(null)
    setNovoStatus({
      nome: '',
      descricao: '',
      tipo: 'andamento',
      cor: '#3B82F6',
      padrao: false,
      ordem: statusList.length + 1
    })
  }

  const handleEditUser = (usuario: Usuario) => {
    setEditingUser(usuario)
    setNovoUsuario({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      cargo: usuario.cargo,
      nivel: usuario.nivel,
      status: usuario.status
    })
    setShowUserDialog(true)
  }

  const handleEditCategory = (categoria: Categoria) => {
    setEditingCategory(categoria)
    setNovaCategoria({
      nome: categoria.nome,
      descricao: categoria.descricao,
      cor: categoria.cor,
      ativa: categoria.ativa
    })
    setShowCategoryDialog(true)
  }

  const handleEditStatus = (status: Status) => {
    setEditingStatus(status)
    setNovoStatus({
      nome: status.nome,
      descricao: status.descricao,
      tipo: status.tipo,
      cor: status.cor,
      padrao: status.padrao,
      ordem: status.ordem
    })
    setShowStatusDialog(true)
  }

  const handleDeleteUser = (id: string) => {
    setUsuarios(usuarios.filter(u => u.id !== id))
  }

  const handleDeleteCategory = (id: string) => {
    setCategorias(categorias.filter(c => c.id !== id))
  }

  const handleDeleteStatus = (id: string) => {
    setStatusList(statusList.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-500 mt-1">Gerencie usuários, categorias e status do sistema</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Database className="w-4 h-4 mr-2" />
            Backup
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Sistema
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usuarios" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <span>Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Status</span>
          </TabsTrigger>
          <TabsTrigger value="geral" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Geral</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba de Usuários */}
        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Gerenciamento de Usuários</span>
                  </CardTitle>
                  <CardDescription>Crie e gerencie os usuários que terão acesso ao sistema</CardDescription>
                </div>
                <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingUser(null); setNovoUsuario({ nome: '', email: '', senha: '', cargo: '', nivel: 'tecnico', status: 'ativo' }) }}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
                      <DialogDescription>
                        {editingUser ? 'Edite as informações do usuário selecionado.' : 'Preencha os dados para criar um novo usuário no sistema.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="nome">Nome Completo</Label>
                        <Input
                          id="nome"
                          value={novoUsuario.nome}
                          onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value.toUpperCase() })}
                          placeholder="Digite o nome completo"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          value={novoUsuario.email}
                          onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value.toLowerCase() })}
                          placeholder="exemplo@email.com"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="senha">Senha</Label>
                        <div className="relative">
                          <Input
                            id="senha"
                            type={showPassword ? "text" : "password"}
                            value={novoUsuario.senha}
                            onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                            placeholder={editingUser ? "Deixe em branco para manter a senha atual" : "Digite uma senha forte"}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cargo">Cargo</Label>
                        <Input
                          id="cargo"
                          value={novoUsuario.cargo}
                          onChange={(e) => setNovoUsuario({ ...novoUsuario, cargo: e.target.value })}
                          placeholder="Ex: Técnico Senior"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="nivel">Nível de Acesso</Label>
                        <Select value={novoUsuario.nivel} onValueChange={(value: any) => setNovoUsuario({ ...novoUsuario, nivel: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o nível" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="gerente">Gerente</SelectItem>
                            <SelectItem value="tecnico">Técnico</SelectItem>
                            <SelectItem value="recepcao">Recepção</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="status"
                          checked={novoUsuario.status === 'ativo'}
                          onCheckedChange={(checked) => setNovoUsuario({ ...novoUsuario, status: checked ? 'ativo' : 'inativo' })}
                        />
                        <Label htmlFor="status">Usuário Ativo</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleSaveUser}>
                        <Save className="w-4 h-4 mr-2" />
                        {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usuarios.map((usuario) => (
                  <div key={usuario.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {usuario.nome.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{usuario.nome}</span>
                          <Badge className={getNivelColor(usuario.nivel)}>
                            {usuario.nivel === 'admin' ? 'Admin' : 
                             usuario.nivel === 'gerente' ? 'Gerente' :
                             usuario.nivel === 'tecnico' ? 'Técnico' : 'Recepção'}
                          </Badge>
                          <Badge variant={usuario.status === 'ativo' ? 'default' : 'secondary'}>
                            {usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-500">
                          {usuario.email} • {usuario.cargo}
                        </div>
                        <div className="text-xs text-slate-400">
                          Criado em {usuario.dataCriacao} • Último acesso: {usuario.ultimoAcesso}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(usuario)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteUser(usuario.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Categorias */}
        <TabsContent value="categorias" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Tag className="w-5 h-5" />
                    <span>Gerenciamento de Categorias</span>
                  </CardTitle>
                  <CardDescription>Crie e gerencie categorias para organizar seus serviços</CardDescription>
                </div>
                <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingCategory(null); setNovaCategoria({ nome: '', descricao: '', cor: '#3B82F6', ativa: true }) }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Criar Nova Categoria'}</DialogTitle>
                      <DialogDescription>
                        {editingCategory ? 'Edite as informações da categoria selecionada.' : 'Preencha os dados para criar uma nova categoria.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="nome">Nome da Categoria</Label>
                        <Input
                          id="nome"
                          value={novaCategoria.nome}
                          onChange={(e) => setNovaCategoria({ ...novaCategoria, nome: e.target.value.toUpperCase() })}
                          placeholder="Ex: Notebooks"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                          id="descricao"
                          value={novaCategoria.descricao}
                          onChange={(e) => setNovaCategoria({ ...novaCategoria, descricao: e.target.value })}
                          placeholder="Descreva os tipos de serviços desta categoria"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cor">Cor</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="cor"
                            type="color"
                            value={novaCategoria.cor}
                            onChange={(e) => setNovaCategoria({ ...novaCategoria, cor: e.target.value })}
                            className="w-20 h-10"
                          />
                          <Input
                            value={novaCategoria.cor}
                            onChange={(e) => setNovaCategoria({ ...novaCategoria, cor: e.target.value })}
                            placeholder="#3B82F6"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="ativa"
                          checked={novaCategoria.ativa}
                          onCheckedChange={(checked) => setNovaCategoria({ ...novaCategoria, ativa: checked })}
                        />
                        <Label htmlFor="ativa">Categoria Ativa</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleSaveCategory}>
                        <Save className="w-4 h-4 mr-2" />
                        {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {categorias.map((categoria) => (
                  <div key={categoria.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: categoria.cor }}
                      >
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{categoria.nome}</span>
                          <Badge variant={categoria.ativa ? 'default' : 'secondary'}>
                            {categoria.ativa ? 'Ativa' : 'Inativa'}
                          </Badge>
                          <Badge variant="outline">
                            {categoria.quantidadeOS} OS
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-500">{categoria.descricao}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditCategory(categoria)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(categoria.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Status */}
        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Gerenciamento de Status</span>
                  </CardTitle>
                  <CardDescription>Crie e gerencie os status das ordens de serviço</CardDescription>
                </div>
                <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingStatus(null); setNovoStatus({ nome: '', descricao: '', tipo: 'andamento', cor: '#3B82F6', padrao: false, ordem: statusList.length + 1 }) }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingStatus ? 'Editar Status' : 'Criar Novo Status'}</DialogTitle>
                      <DialogDescription>
                        {editingStatus ? 'Edite as informações do status selecionado.' : 'Preencha os dados para criar um novo status.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="nome">Nome do Status</Label>
                        <Input
                          id="nome"
                          value={novoStatus.nome}
                          onChange={(e) => setNovoStatus({ ...novoStatus, nome: e.target.value })}
                          placeholder="Ex: Aguardando Peça"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                          id="descricao"
                          value={novoStatus.descricao}
                          onChange={(e) => setNovoStatus({ ...novoStatus, descricao: e.target.value })}
                          placeholder="Descreva quando este status deve ser usado"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="tipo">Tipo</Label>
                        <Select value={novoStatus.tipo} onValueChange={(value: any) => setNovoStatus({ ...novoStatus, tipo: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inicial">Inicial</SelectItem>
                            <SelectItem value="andamento">Andamento</SelectItem>
                            <SelectItem value="final">Final</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cor">Cor</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="cor"
                            type="color"
                            value={novoStatus.cor}
                            onChange={(e) => setNovoStatus({ ...novoStatus, cor: e.target.value })}
                            className="w-20 h-10"
                          />
                          <Input
                            value={novoStatus.cor}
                            onChange={(e) => setNovoStatus({ ...novoStatus, cor: e.target.value })}
                            placeholder="#3B82F6"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ordem">Ordem</Label>
                        <Input
                          id="ordem"
                          type="number"
                          value={novoStatus.ordem}
                          onChange={(e) => setNovoStatus({ ...novoStatus, ordem: parseInt(e.target.value) })}
                          placeholder="1"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="padrao"
                          checked={novoStatus.padrao}
                          onCheckedChange={(checked) => setNovoStatus({ ...novoStatus, padrao: checked })}
                        />
                        <Label htmlFor="padrao">Status Padrão</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleSaveStatus}>
                        <Save className="w-4 h-4 mr-2" />
                        {editingStatus ? 'Salvar Alterações' : 'Criar Status'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusList
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((status) => (
                  <div key={status.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: status.cor }}
                      >
                        {status.tipo === 'inicial' && <Clock className="w-5 h-5" />}
                        {status.tipo === 'andamento' && <AlertTriangle className="w-5 h-5" />}
                        {status.tipo === 'final' && <CheckCircle className="w-5 h-5" />}
                        {status.tipo === 'cancelado' && <XCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{status.nome}</span>
                          <Badge className={getTipoColor(status.tipo)}>
                            {status.tipo === 'inicial' ? 'Inicial' :
                             status.tipo === 'andamento' ? 'Andamento' :
                             status.tipo === 'final' ? 'Final' : 'Cancelado'}
                          </Badge>
                          {status.padrao && <Badge variant="outline">Padrão</Badge>}
                          <Badge variant="outline">Ordem {status.ordem}</Badge>
                        </div>
                        <div className="text-sm text-slate-500">{status.descricao}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditStatus(status)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteStatus(status.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Configurações Gerais */}
        <TabsContent value="geral" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurações da Empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Informações da Empresa</span>
                </CardTitle>
                <CardDescription>Configure os dados da sua empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="empresa">Nome da Empresa</Label>
                  <Input id="empresa" defaultValue="Lion Tech" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" placeholder="00.000.000/0000-00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" defaultValue="(11) 9999-9999" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" defaultValue="contato@liontech.com.br" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" defaultValue="São Paulo - SP" />
                </div>
                <Button className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Informações
                </Button>
              </CardContent>
            </Card>

            {/* Configurações do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Configurações do Sistema</span>
                </CardTitle>
                <CardDescription>Personalize o comportamento do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações por E-mail</Label>
                    <p className="text-sm text-slate-500">Reber alertas sobre novas ordens</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Backup Automático</Label>
                    <p className="text-sm text-slate-500">Salvar dados automaticamente</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo Escuro</Label>
                    <p className="text-sm text-slate-500">Usar tema escuro na interface</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confirmação de Ações</Label>
                    <p className="text-sm text-slate-500">Pedir confirmação para ações críticas</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="moeda">Moeda Padrão</Label>
                  <Select defaultValue="BRL">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>

            {/* Configurações de Impressão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Printer className="w-5 h-5" />
                  <span>Configurações de Impressão</span>
                </CardTitle>
                <CardDescription>Personalize documentos e relatórios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cabeçalho em Ordens</Label>
                    <p className="text-sm text-slate-500">Incluir cabeçalho nas OS</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Rodapé Personalizado</Label>
                    <p className="text-sm text-slate-500">Incluir rodapé com informações</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Código de Barras</Label>
                    <p className="text-sm text-slate-500">Gerar código para as OS</p>
                  </div>
                  <Switch />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="papel">Tamanho do Papel</Label>
                  <Select defaultValue="A4">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="A5">A5</SelectItem>
                      <SelectItem value="Letter">Carta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>

            {/* Configurações de Segurança */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Segurança e Privacidade</span>
                </CardTitle>
                <CardDescription>Configure as opções de segurança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autenticação em Dois Fatores</Label>
                    <p className="text-sm text-slate-500">Exigir 2FA para todos os usuários</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Expiração de Senha</Label>
                    <p className="text-sm text-slate-500">Trocar senha a cada 90 dias</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Log de Atividades</Label>
                    <p className="text-sm text-slate-500">Registrar todas as ações</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sessao">Tempo de Sessão</Label>
                  <Select defaultValue="8h">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2h">2 horas</SelectItem>
                      <SelectItem value="4h">4 horas</SelectItem>
                      <SelectItem value="8h">8 horas</SelectItem>
                      <SelectItem value="24h">24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}