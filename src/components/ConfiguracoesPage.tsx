'use client'

import { useState, useEffect, useRef } from 'react'
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
import { toast } from 'sonner'

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

  // Usuários do backend
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  const [categorias, setCategorias] = useState<Categoria[]>([])

  const [statusList, setStatusList] = useState<Status[]>([])

  const [novoUsuario, setNovoUsuario] = useState<{
    nome: string
    email: string
    senha: string
    cargo: string
    nivel: Usuario['nivel']
    status: Usuario['status']
  }>({
    nome: '',
    email: '',
    senha: '',
    cargo: '',
    nivel: 'tecnico',
    status: 'ativo'
  })

  const [novaCategoria, setNovaCategoria] = useState({
    nome: '',
    descricao: '',
    cor: '#3B82F6',
    ativa: true
  })

  const [novoStatus, setNovoStatus] = useState<{
    nome: string
    descricao: string
    tipo: Status['tipo']
    cor: string
    padrao: boolean
    ordem: number
  }>({
    nome: '',
    descricao: '',
    tipo: 'andamento',
    cor: '#3B82F6',
    padrao: false,
    ordem: 1
  })

  // Configurações Gerais
  const [empresa, setEmpresa] = useState({
    nome: 'Lion Tech',
    cnpj: '',
    telefone: '(11) 9999-9999',
    email: 'contato@liontech.com.br',
    endereco: 'São Paulo - SP',
  })

  const [sistemaCfg, setSistemaCfg] = useState({
    notificacoesEmail: true,
    backupAutomatico: true,
    modoEscuro: false,
    confirmacaoAcoes: true,
    moedaPadrao: 'BRL',
  })

  const [impressao, setImpressao] = useState({
    cabecalhoOrdens: true,
    rodapeHabilitado: true,
    codigoBarras: false,
    tamanhoPapel: 'A4',
    logoUrl: '',
  })

  const [seguranca, setSeguranca] = useState({
    doisFatores: false,
    expiracaoSenha: false,
    logAtividades: true,
    sessao: '8h',
  })

  // Dialog do botão Sistema
  const [showSystemDialog, setShowSystemDialog] = useState(false)
  const [systemInfo, setSystemInfo] = useState<any>(null)

  // Carregar dados iniciais (usuários, categorias, status, config)
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetch('/api/usuarios')
        if (res.ok) {
          const data = await res.json()
          setUsuarios(Array.isArray(data) ? data : [])
        } else {
          setUsuarios([])
        }
      } catch (e) {
        console.error('Erro ao carregar usuários:', e)
        setUsuarios([])
      }
    }

    const fetchCategorias = async () => {
      try {
        const res = await fetch('/api/categorias')
        if (res.ok) {
          const data = await res.json()
          const mapped = (Array.isArray(data) ? data : []).map((c: any) => ({
            id: c.id,
            nome: c.nome,
            descricao: c.descricao || '',
            cor: c.cor || '#3B82F6',
            ativa: c.ativa ?? true,
            quantidadeOS: c.quantidadeOS ?? 0,
          }))
          setCategorias(mapped)
        } else {
          setCategorias([])
        }
      } catch (e) {
        console.error('Erro ao carregar categorias:', e)
        setCategorias([])
      }
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status')
        if (res.ok) {
          const data = await res.json()
          const mapped = (Array.isArray(data) ? data : []).map((s: any) => ({
            id: s.id,
            nome: s.nome,
            descricao: s.descricao || '',
            tipo: s.tipo || 'andamento',
            cor: s.cor || '#3B82F6',
            padrao: s.padrao ?? false,
            ordem: s.ordem ?? 1,
          }))
          setStatusList(mapped)
        } else {
          setStatusList([])
        }
      } catch (e) {
        console.error('Erro ao carregar status:', e)
        setStatusList([])
      }
    }

    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config')
        if (res.ok) {
          const cfg = await res.json()
          if (cfg.empresa) setEmpresa({
            nome: cfg.empresa.nome || '',
            cnpj: cfg.empresa.cnpj || '',
            telefone: cfg.empresa.telefone || '',
            email: cfg.empresa.email || '',
            endereco: cfg.empresa.endereco || '',
          })
          if (cfg.sistema) setSistemaCfg({
            notificacoesEmail: !!cfg.sistema.notificacoesEmail,
            backupAutomatico: !!cfg.sistema.backupAutomatico,
            modoEscuro: !!cfg.sistema.modoEscuro,
            confirmacaoAcoes: !!cfg.sistema.confirmacaoAcoes,
            moedaPadrao: cfg.sistema.moedaPadrao || 'BRL',
          })
          if (cfg.impressao) setImpressao({
            cabecalhoOrdens: cfg.impressao.cabecalhoOrdens ?? true,
            rodapeHabilitado: cfg.impressao.rodapeHabilitado ?? true,
            codigoBarras: cfg.impressao.codigoBarras ?? false,
            tamanhoPapel: cfg.impressao.tamanhoPapel || 'A4',
            logoUrl: cfg.impressao.logoUrl || '',
          })
          if (cfg.seguranca) setSeguranca({
            doisFatores: !!cfg.seguranca.doisFatores,
            expiracaoSenha: !!cfg.seguranca.expiracaoSenha,
            logAtividades: cfg.seguranca.logAtividades ?? true,
            sessao: cfg.seguranca.sessao || '8h',
          })
        }
      } catch (e) {
        console.error('Erro ao carregar configurações:', e)
      }
    }

    fetchUsuarios()
    fetchCategorias()
    fetchStatus()
    fetchConfig()
  }, [])

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

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await fetch(`/api/usuarios/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            cargo: novoUsuario.cargo,
            nivel: novoUsuario.nivel,
            status: novoUsuario.status,
          }),
        })
      } else {
        await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novoUsuario),
        })
      }
      const res = await fetch('/api/usuarios')
      setUsuarios(res.ok ? await res.json() : [])
    } catch (e) {
      console.error('Erro ao salvar usuário:', e)
    } finally {
      setShowUserDialog(false)
      setEditingUser(null)
      setNovoUsuario({ nome: '', email: '', senha: '', cargo: '', nivel: 'tecnico', status: 'ativo' })
    }
  }

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await fetch(`/api/categorias/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novaCategoria),
        })
      } else {
        await fetch('/api/categorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...novaCategoria, quantidadeOS: 0 }),
        })
      }
      const res = await fetch('/api/categorias')
      const data = res.ok ? await res.json() : []
      const mapped = (Array.isArray(data) ? data : []).map((c: any) => ({
        id: c.id,
        nome: c.nome,
        descricao: c.descricao || '',
        cor: c.cor || '#3B82F6',
        ativa: c.ativa ?? true,
        quantidadeOS: c.quantidadeOS ?? 0,
      }))
      setCategorias(mapped)
    } catch (e) {
      console.error('Erro ao salvar categoria:', e)
    } finally {
      setShowCategoryDialog(false)
      setEditingCategory(null)
      setNovaCategoria({ nome: '', descricao: '', cor: '#3B82F6', ativa: true })
    }
  }

  const handleSaveStatus = async () => {
    try {
      if (editingStatus) {
        await fetch(`/api/status/${editingStatus.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novoStatus),
        })
      } else {
        await fetch('/api/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novoStatus),
        })
      }
      const res = await fetch('/api/status')
      const data = res.ok ? await res.json() : []
      const mapped = (Array.isArray(data) ? data : []).map((s: any) => ({
        id: s.id,
        nome: s.nome,
        descricao: s.descricao || '',
        tipo: s.tipo || 'andamento',
        cor: s.cor || '#3B82F6',
        padrao: s.padrao ?? false,
        ordem: s.ordem ?? 1,
      }))
      setStatusList(mapped)
    } catch (e) {
      console.error('Erro ao salvar status:', e)
    } finally {
      setShowStatusDialog(false)
      setEditingStatus(null)
      setNovoStatus({ nome: '', descricao: '', tipo: 'andamento', cor: '#3B82F6', padrao: false, ordem: 1 })
    }
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

  const handleDeleteUser = async (id: string) => {
    try {
      await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
      const res = await fetch('/api/usuarios')
      setUsuarios(res.ok ? await res.json() : [])
    } catch (e) {
      console.error('Erro ao excluir usuário:', e)
    }
  }

  // Persistência das Configurações
  const saveEmpresa = async () => {
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa }),
      })
    } catch (e) { console.error('Erro ao salvar empresa:', e) }
  }
  const saveSistema = async () => {
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sistema: sistemaCfg }),
      })
    } catch (e) { console.error('Erro ao salvar sistema:', e) }
  }
  const saveImpressao = async () => {
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ impressao }),
      })
    } catch (e) { console.error('Erro ao salvar impressão:', e) }
  }
  const saveSeguranca = async () => {
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seguranca }),
      })
    } catch (e) { console.error('Erro ao salvar segurança:', e) }
  }

  // Upload da Logo (Impressão)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageSrc, setImageSrc] = useState<string>('')
  const [imgNatural, setImgNatural] = useState<{w:number,h:number} | null>(null)
  const [zoom, setZoom] = useState<number>(1)
  const [posX, setPosX] = useState<number>(50)
  const [posY, setPosY] = useState<number>(50)

  const triggerLogoUpload = () => fileInputRef.current?.click()

  const onLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Validação de tipo e tamanho
    const allowed = ['image/png','image/jpeg','image/webp','image/svg+xml']
    if (!allowed.includes(file.type)) {
      toast.error('Formato inválido. Envie PNG, JPG ou WebP (SVG opcional).')
      e.target.value = ''
      return
    }
    const maxSizeMB = 4
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo ${maxSizeMB}MB.`)
      e.target.value = ''
      return
    }
    // SVG: não recortamos/redimensionamos; envia direto
    if (file.type === 'image/svg+xml') {
      try {
        setUploadingLogo(true)
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/uploads/logo', { method: 'POST', body: form })
        if (!res.ok) throw new Error('Falha no upload da logo')
        const data = await res.json()
        const url = data?.url as string
        if (url) {
          setImpressao((prev) => ({ ...prev, logoUrl: url }))
          await fetch('/api/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ impressao: { ...impressao, logoUrl: url } }),
          })
          toast.success('Logo enviada com sucesso!')
        }
      } catch (err) {
        console.error('Erro ao enviar logo:', err)
        toast.error('Não foi possível enviar a logo.')
      } finally {
        setUploadingLogo(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
      return
    }

    // Para PNG/JPEG/WEBP: abrir modal de recorte
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = String(ev.target?.result || '')
      setImageSrc(src)
      setSelectedFile(file)
      setZoom(1)
      setPosX(50)
      setPosY(50)
      setCropOpen(true)
      // carregar dimensões naturais
      const img = new Image()
      img.onload = () => setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  // Gera um Blob 512x512 a partir do recorte atual
  const renderCroppedBlob = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!imageSrc || !imgNatural) return reject(new Error('Imagem não carregada'))
      const img = new Image()
      img.onload = () => {
        const CANVAS_SIZE = 512
        const canvas = document.createElement('canvas')
        canvas.width = CANVAS_SIZE
        canvas.height = CANVAS_SIZE
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0,0,CANVAS_SIZE,CANVAS_SIZE)

        const { w: iw, h: ih } = imgNatural
        // escala base para cobrir o quadrado
        const baseScale = Math.max(CANVAS_SIZE / iw, CANVAS_SIZE / ih)
        const scale = baseScale * zoom
        const drawW = iw * scale
        const drawH = ih * scale
        const maxOffsetX = Math.max(0, (drawW - CANVAS_SIZE) / 2)
        const maxOffsetY = Math.max(0, (drawH - CANVAS_SIZE) / 2)
        const offsetX = ((posX - 50) / 50) * maxOffsetX
        const offsetY = ((posY - 50) / 50) * maxOffsetY
        const dx = (CANVAS_SIZE - drawW) / 2 - offsetX
        const dy = (CANVAS_SIZE - drawH) / 2 - offsetY
        ctx.drawImage(img, dx, dy, drawW, drawH)
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Falha ao gerar imagem'))
          resolve(blob)
        }, 'image/webp', 0.9)
      }
      img.onerror = reject
      img.src = imageSrc
    })
  }

  const handleConfirmCropAndUpload = async () => {
    try {
      setUploadingLogo(true)
      const blob = await renderCroppedBlob()
      const form = new FormData()
      form.append('file', new File([blob], (selectedFile?.name || 'logo') + '.webp', { type: 'image/webp' }))
      const res = await fetch('/api/uploads/logo', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Falha no upload da logo')
      const data = await res.json()
      const url = data?.url as string
      if (url) {
        setImpressao((prev) => ({ ...prev, logoUrl: url }))
        await fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ impressao: { ...impressao, logoUrl: url } }),
        })
      }
      toast.success('Logo recortada e enviada!')
      setCropOpen(false)
      setSelectedFile(null)
      setImageSrc('')
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível processar a logo.')
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Ações Topo
  const handleBackup = async () => {
    try {
      const res = await fetch('/api/backup')
      if (!res.ok) return
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-liontech-${new Date().toISOString().slice(0,10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Erro ao gerar backup:', e)
    }
  }

  const openSystemInfo = async () => {
    try {
      const res = await fetch('/api/health')
      const info = res.ok ? await res.json() : null
      setSystemInfo(info)
    } catch (e) {
      console.error('Erro ao carregar informações do sistema:', e)
    } finally {
      setShowSystemDialog(true)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await fetch(`/api/categorias/${id}`, { method: 'DELETE' })
      setCategorias(categorias.filter(c => c.id !== id))
    } catch (e) {
      console.error('Erro ao excluir categoria:', e)
    }
  }

  const handleDeleteStatus = async (id: string) => {
    try {
      await fetch(`/api/status/${id}`, { method: 'DELETE' })
      setStatusList(statusList.filter(s => s.id !== id))
    } catch (e) {
      console.error('Erro ao excluir status:', e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-500 mt-1">Gerencie usuários, categorias e status do sistema</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleBackup}>
            <Database className="w-4 h-4 mr-2" />
            Backup
          </Button>
          <Button variant="outline" size="sm" onClick={openSystemInfo}>
            <Settings className="w-4 h-4 mr-2" />
            Sistema
          </Button>
        </div>
      </div>

      {/* Dialog: Informações do Sistema */}
      <Dialog open={showSystemDialog} onOpenChange={setShowSystemDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Informações do Sistema</DialogTitle>
            <DialogDescription>Ambiente e status da API</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {systemInfo ? (
              <pre className="bg-slate-50 p-4 rounded border overflow-auto max-h-80">{JSON.stringify(systemInfo, null, 2)}</pre>
            ) : (
              <p>Carregando...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                  <Input id="empresa" value={empresa.nome} onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" placeholder="00.000.000/0000-00" value={empresa.cnpj} onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" value={empresa.telefone} onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={empresa.email} onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" value={empresa.endereco} onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })} />
                </div>
                <Button className="w-full" onClick={saveEmpresa}>
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
                  <Switch checked={sistemaCfg.notificacoesEmail} onCheckedChange={(v) => setSistemaCfg({ ...sistemaCfg, notificacoesEmail: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Backup Automático</Label>
                    <p className="text-sm text-slate-500">Salvar dados automaticamente</p>
                  </div>
                  <Switch checked={sistemaCfg.backupAutomatico} onCheckedChange={(v) => setSistemaCfg({ ...sistemaCfg, backupAutomatico: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo Escuro</Label>
                    <p className="text-sm text-slate-500">Usar tema escuro na interface</p>
                  </div>
                  <Switch checked={sistemaCfg.modoEscuro} onCheckedChange={(v) => setSistemaCfg({ ...sistemaCfg, modoEscuro: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confirmação de Ações</Label>
                    <p className="text-sm text-slate-500">Pedir confirmação para ações críticas</p>
                  </div>
                  <Switch checked={sistemaCfg.confirmacaoAcoes} onCheckedChange={(v) => setSistemaCfg({ ...sistemaCfg, confirmacaoAcoes: v })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="moeda">Moeda Padrão</Label>
                  <Select value={sistemaCfg.moedaPadrao} onValueChange={(v: any) => setSistemaCfg({ ...sistemaCfg, moedaPadrao: v })}>
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
                <Button className="w-full" onClick={saveSistema}>
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
                {/* Logo da empresa para impressão */}
                <div className="grid md:grid-cols-[120px_1fr] items-center gap-4">
                  <div className="flex items-center justify-center w-28 h-28 rounded border bg-slate-50 overflow-hidden">
                    {impressao.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={impressao.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-xs text-slate-400 text-center px-2">Prévia da logo</span>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="logoUrl">Logo (URL) opcional</Label>
                    <div className="flex gap-2">
                      <Input
                        id="logoUrl"
                        placeholder="https://.../minha-logo.png"
                        value={impressao.logoUrl || ''}
                        onChange={(e) => setImpressao({ ...impressao, logoUrl: e.target.value })}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={onLogoFileChange}
                      />
                      <Button type="button" variant="outline" onClick={triggerLogoUpload} disabled={uploadingLogo}>
                        {uploadingLogo ? 'Enviando...' : 'Upload'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setImpressao({ ...impressao, logoUrl: '' })}
                      >
                        Limpar
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">Você pode colar uma URL direta ou fazer upload.</p>
                  </div>
                </div>
                {/* Modal de recorte da logo */}
                <Dialog open={cropOpen} onOpenChange={setCropOpen}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Recortar e centralizar logo</DialogTitle>
                      <DialogDescription>
                        Ajuste o enquadramento. A imagem será enviada em 512×512 px.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="w-full flex justify-center">
                        <div className="relative w-[280px] h-[280px] rounded-md border bg-slate-50 overflow-hidden">
                          {imageSrc && imgNatural ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageSrc}
                              alt="Prévia"
                              style={(function(){
                                const PREV = 280
                                const base = Math.max(PREV / imgNatural.w, PREV / imgNatural.h)
                                const s = base * zoom
                                const drawW = imgNatural.w * s
                                const drawH = imgNatural.h * s
                                const maxOx = Math.max(0,(drawW - PREV) / 2)
                                const maxOy = Math.max(0,(drawH - PREV) / 2)
                                const ox = ((posX - 50)/50) * maxOx
                                const oy = ((posY - 50)/50) * maxOy
                                const left = (PREV - drawW)/2 - ox
                                const top = (PREV - drawH)/2 - oy
                                return { position:'absolute' as const, left, top, width: drawW, height: drawH }
                              })()}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Carregando imagem…</div>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3">
                        <div>
                          <Label>Zoom</Label>
                          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e)=>setZoom(parseFloat(e.target.value))} className="w-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Horizontal</Label>
                            <input type="range" min={0} max={100} step={1} value={posX} onChange={(e)=>setPosX(parseInt(e.target.value))} className="w-full" />
                          </div>
                          <div>
                            <Label>Vertical</Label>
                            <input type="range" min={0} max={100} step={1} value={posY} onChange={(e)=>setPosY(parseInt(e.target.value))} className="w-full" />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-between">
                          <Button type="button" variant="outline" onClick={()=>{ setPosX(50); setPosY(50); setZoom(1); }}>Centralizar</Button>
                          <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={()=> setCropOpen(false)}>Cancelar</Button>
                            <Button type="button" onClick={handleConfirmCropAndUpload} disabled={uploadingLogo}>{uploadingLogo? 'Enviando…' : 'Aplicar e Enviar'}</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cabeçalho em Ordens</Label>
                    <p className="text-sm text-slate-500">Incluir cabeçalho nas OS</p>
                  </div>
                  <Switch checked={impressao.cabecalhoOrdens} onCheckedChange={(v) => setImpressao({ ...impressao, cabecalhoOrdens: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Rodapé Personalizado</Label>
                    <p className="text-sm text-slate-500">Incluir rodapé com informações</p>
                  </div>
                  <Switch checked={impressao.rodapeHabilitado} onCheckedChange={(v) => setImpressao({ ...impressao, rodapeHabilitado: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Código de Barras</Label>
                    <p className="text-sm text-slate-500">Gerar código para as OS</p>
                  </div>
                  <Switch checked={impressao.codigoBarras} onCheckedChange={(v) => setImpressao({ ...impressao, codigoBarras: v })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="papel">Tamanho do Papel</Label>
                  <Select value={impressao.tamanhoPapel} onValueChange={(v: any) => setImpressao({ ...impressao, tamanhoPapel: v })}>
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
                <Button className="w-full" onClick={saveImpressao}>
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
                  <Switch checked={seguranca.doisFatores} onCheckedChange={(v) => setSeguranca({ ...seguranca, doisFatores: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Expiração de Senha</Label>
                    <p className="text-sm text-slate-500">Trocar senha a cada 90 dias</p>
                  </div>
                  <Switch checked={seguranca.expiracaoSenha} onCheckedChange={(v) => setSeguranca({ ...seguranca, expiracaoSenha: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Log de Atividades</Label>
                    <p className="text-sm text-slate-500">Registrar todas as ações</p>
                  </div>
                  <Switch checked={seguranca.logAtividades} onCheckedChange={(v) => setSeguranca({ ...seguranca, logAtividades: v })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sessao">Tempo de Sessão</Label>
                  <Select value={seguranca.sessao} onValueChange={(v: any) => setSeguranca({ ...seguranca, sessao: v })}>
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
                <Button className="w-full" onClick={saveSeguranca}>
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