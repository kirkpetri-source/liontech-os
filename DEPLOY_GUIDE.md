# 🚀 Guia de Deploy no Vercel

Este guia irá ajudá-lo a fazer o deploy do Sistema de Ordens de Serviço no Vercel.

## 📋 Pré-requisitos

1. **Firebase configurado** (siga o `FIREBASE_SETUP.md`)
2. **Conta no Vercel** ([https://vercel.com](https://vercel.com))
3. **Repositório no GitHub** com o código do projeto

## 🔧 Passo 1: Preparar o Projeto

1. **Verifique se tudo está funcionando localmente**
   ```bash
   npm run build
   ```

2. **Configure as variáveis de ambiente**
   - Copie `.env.local` para `.env.production`
   - **NÃO** faça commit dos arquivos `.env*`

## 📦 Passo 2: Fazer Upload para o GitHub

1. **Inicialize o Git (se ainda não fez)**
   ```bash
   git init
   git add .
   git commit -m "Sistema de Ordens de Serviço com Firebase"
   ```

2. **Crie o repositório no GitHub**
   - Vá para [https://github.com](https://github.com)
   - Crie um novo repositório (ex: `sistema-ordens-servico`)
   - **NÃO** adicione README, .gitignore ou license

3. **Conecte e envie o código**
   ```bash
   git remote add origin https://github.com/SEU_USERNAME/sistema-ordens-servico.git
   git branch -M main
   git push -u origin main
   ```

## 🚀 Passo 3: Configurar no Vercel

1. **Importe o projeto**
   - Faça login no Vercel com sua conta GitHub
   - Clique em "Add New..." → "Project"
   - Selecione o repositório do GitHub

2. **Configure as variáveis de ambiente**
   - Na página de configuração do projeto, vá para "Environment Variables"
   - Adicione todas as variáveis do Firebase:
   
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=sua_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=sua_measurement_id
   FIREBASE_PROJECT_ID=seu_project_id
   FIREBASE_CLIENT_EMAIL=seu_email_de_servico
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nsua_chave_privada\n-----END PRIVATE KEY-----
   FIREBASE_STORAGE_BUCKET=seu_project_id.appspot.com
   ```

3. **Configure o Build**
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o processo de build e deploy

## 🔒 Passo 4: Configurar Domínios Autorizados (Firebase)

1. **No Firebase Console**
   - Vá para Authentication → Configurações
   - Na aba "Domínios autorizados", adicione:
   - `seu-projeto.vercel.app`
   - `www.seu-dominio-custom.com` (se tiver)

## 🧪 Passo 5: Testar o Deploy

1. **Acesse sua aplicação**
   - URL será algo como `https://seu-projeto.vercel.app`

2. **Teste as funcionalidades**
   - Login/Logout
   - Criação de usuários
   - Cadastro de clientes
   - Criação de ordens de serviço

## 🔄 Atualizações Futuras

### Para fazer atualizações:

1. **Faça as alterações localmente**
   ```bash
   # Teste localmente
   npm run dev
   
   # Verifique o build
   npm run build
   ```

2. **Commit e push**
   ```bash
   git add .
   git commit -m "Descrição da atualização"
   git push origin main
   ```

3. **Vercel fará o deploy automaticamente**

## 🐛 Problemas Comuns no Deploy

### Erro: "Build failed"
- **Causa**: Erro de código ou dependências
- **Solução**: Verifique os logs de build no Vercel

### Erro: "Firebase not configured"
- **Causa**: Variáveis de ambiente ausentes
- **Solução**: Verifique todas as variáveis no dashboard do Vercel

### Erro: "Authentication failed"
- **Causa**: Domínio não autorizado no Firebase
- **Solução**: Adicione o domínio do Vercel no Firebase Console

## 📊 Monitoramento

1. **Vercel Analytics**
   - Acompanhe visitas e performance
   - Configure metas e conversões

2. **Firebase Analytics**
   - Configure para coletar dados de uso
   - Monitore eventos de autenticação

## 🎉 Parabéns!

Seu Sistema de Ordens de Serviço está no ar! 🚀

---

**Dicas importantes:**
- Mantenha suas variáveis de ambiente seguras
- Faça backup regular dos dados
- Monitore os logs de erro
- Mantenha o projeto atualizado

---

**Próximos passos opcionais:**
- Configurar domínio personalizado
- Adicionar SSL (já vem com Vercel)
- Configurar CI/CD avançado
- Adicionar testes automatizados