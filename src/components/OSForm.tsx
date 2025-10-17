'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Wrench, CreditCard, DollarSign, Receipt, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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

interface OSFormProps {
  onClose: () => void
  onSave: (os: OrdemServico) => void
}

export default function OSForm({ onClose, onSave }: OSFormProps) {
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

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [statusList, setStatusList] = useState<Status[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState(true)

  const formasPagamento = ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência Bancária', 'Boleto']

  // Removidos fallbacks: categorias e status devem refletir exclusivamente o que está configurado

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

  // Formata entrada como moeda BRL (ex.: 1234 -> 12,34 ; 123456 -> 1.234,56)
  const maskCurrencyBRL = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    const cents = digits.slice(-2).padStart(2, '0')
    let integer = digits.slice(0, -2).replace(/^0+(?=\d)/g, '')
    if (!integer) integer = '0'
    const intFormatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${intFormatted},${cents}`
  }

  // Converte string BRL mascarada para número
  const parseCurrencyBRLToNumber = (value: string) => {
    if (!value) return undefined
    const normalized = value.replace(/\./g, '').replace(',', '.')
    const num = parseFloat(normalized)
    return isNaN(num) ? undefined : num
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidWhatsapp(formData.clienteWhatsapp)) {
      toast.error('Informe um WhatsApp válido (10 ou 11 dígitos).')
      return
    }
    
    // Gerar número da O.S.
    const numeroOS = `OS-${String(Date.now()).slice(-3)}`
    
    // Converter campos para maiúsculas (exceto senha)
    const formattedData = {
      ...formData,
      clienteNome: formData.clienteNome.toUpperCase(),
      equipamentoModelo: formData.equipamentoModelo.toUpperCase(),
      equipamentoProblema: formData.equipamentoProblema.toUpperCase(),
      acessorios: formData.acessorios.toUpperCase(),
      servicoTerceirizado: formData.servicoTerceirizado.toUpperCase(),
      descricaoServico: formData.descricaoServico.toUpperCase(),
      previsaoEntrega: formData.previsaoEntrega && formData.previsaoEntregaHora 
        ? `${formData.previsaoEntrega}T${formData.previsaoEntregaHora}`
        : formData.previsaoEntrega
    }

    const newOS: OrdemServico = {
      id: Date.now().toString(),
      numeroOS,
      ...formattedData,
      valor: parseCurrencyBRLToNumber(formData.valor),
      valorPago: parseCurrencyBRLToNumber(formData.valorPago),
      valorEntrada: parseCurrencyBRLToNumber(formData.valorEntrada),
      pago: formData.pago,
      formaPagamento: formData.formaPagamento || undefined,
      formaPagamentoEntrada: formData.formaPagamentoEntrada || undefined,
      createdAt: new Date().toISOString().split('T')[0]
    }

    onSave(newOS)
    onClose()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="w-5 h-5" />
                  <span>Nova Ordem de Serviço</span>
                </CardTitle>
                <CardDescription>
                  Preencha os dados para criar uma nova ordem de serviço
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onClose}
                className="w-full sm:w-auto"
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
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={formData.clienteWhatsapp}
                      onChange={(e) => setFormData({ ...formData, clienteWhatsapp: maskWhatsapp(e.target.value) })}
                      inputMode="numeric"
                      autoComplete="tel"
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

                {formData.valor && (formData.valorPago || formData.valorEntrada) && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Resumo Financeiro:</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Valor Total:</span>
                        <span className="font-medium">R$ {(parseCurrencyBRLToNumber(formData.valor || '') || 0).toFixed(2)}</span>
                      </div>
                      {formData.valorPago && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Valor Pago:</span>
                          <span className="font-medium text-green-600">R$ {(parseCurrencyBRLToNumber(formData.valorPago || '') || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {formData.valorEntrada && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Valor Entrada:</span>
                          <span className="font-medium text-blue-600">R$ {(parseCurrencyBRLToNumber(formData.valorEntrada || '') || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold border-t pt-1">
                        <span>Saldo Restante:</span>
                        <span className={(((parseCurrencyBRLToNumber(formData.valor || '') || 0) - ((parseCurrencyBRLToNumber(formData.valorPago || '') || 0) + (parseCurrencyBRLToNumber(formData.valorEntrada || '') || 0))) > 0 ? 'text-orange-600' : 'text-green-600')}>
                          R$ {(((parseCurrencyBRLToNumber(formData.valor || '') || 0) - ((parseCurrencyBRLToNumber(formData.valorPago || '') || 0) + (parseCurrencyBRLToNumber(formData.valorEntrada || '') || 0)))).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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

              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1 w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Criar O.S.
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto"
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