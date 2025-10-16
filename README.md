# 🛠️ Sistema de Ordens de Serviço

Sistema completo para gerenciamento de ordens de serviço desenvolvido com Next.js 15, TypeScript, Tailwind CSS e Firebase.

## ✨ Funcionalidades

- 🔐 **Autenticação Firebase** (Email/Senha e Google)
- 👥 **Gestão de Clientes** (Cadastro, edição, busca)
- 📋 **Ordens de Serviço** (Criação, acompanhamento, status)
- 📊 **Dashboard** com estatísticas em tempo real
- ⚙️ **Sistema de Configurações** (Categorias e status personalizados)
- 📱 **Design Responsivo** (Mobile-first)
- 🎨 **Interface Moderna** com shadcn/ui

## 🚀 Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Database**: Prisma ORM com SQLite
- **Authentication**: Firebase Auth
- **Backend**: Next.js API Routes
- **State Management**: Zustand, React Query
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📋 Pré-requisitos

- Node.js 18+
- Conta Google (para Firebase)
- Conta GitHub (para deploy)

## 🔥 Configuração Rápida

### 1. Firebase Setup
```bash
# Siga o guia completo
cat FIREBASE_SETUP.md
```

### 2. Instalação
```bash
# Clone o repositório
git clone https://github.com/SEU_USERNAME/sistema-ordens-servico.git
cd sistema-ordens-servico

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais Firebase

# Inicialize o banco de dados
npm run db:push
npm run db:seed

# Inicie o desenvolvimento
npm run dev
```

### 3. Configure o Firebase
1. Crie um projeto em [Firebase Console](https://console.firebase.google.com/)
2. Ative Authentication (Email/Senha e Google)
3. Crie Firestore Database
4. Copie as credenciais para `.env.local`

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API Routes
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   ├── ClientesPage.tsx  # Gestão de clientes
│   ├── OrdensServicoPage.tsx # Gestão de O.S.
│   ├── OSForm.tsx        # Formulário de O.S.
│   └── ConfiguracoesPage.tsx # Configurações
├── hooks/                 # Hooks personalizados
│   ├── use-auth.tsx      # Hook de autenticação
│   └── use-toast.ts      # Hook de notificações
├── lib/                   # Bibliotecas utilitárias
│   ├── firebase.ts       # Configuração Firebase Client
│   ├── firebase-admin.ts # Configuração Firebase Admin
│   ├── db.ts             # Configuração Prisma
│   └── utils.ts          # Utilitários gerais
└── providers/             # Context Providers
    └── firebase-provider.tsx
```

## 🎯 Funcionalidades Detalhadas

### Gestão de Clientes
- ✅ Cadastro de novos clientes
- ✅ Edição de dados existentes
- ✅ Busca e filtragem
- ✅ Validação de formulários
- ✅ Interface responsiva

### Ordens de Serviço
- ✅ Criação de novas O.S.
- ✅ Acompanhamento de status
- ✅ Gestão de categorias
- ✅ Histórico de serviços
- ✅ Filtros avançados

### Sistema de Autenticação
- ✅ Login com email e senha
- ✅ Login com Google
- ✅ Registro de novos usuários
- ✅ Recuperação de senha
- ✅ Proteção de rotas

### Dashboard
- ✅ Estatísticas em tempo real
- ✅ Gráficos e visualizações
- ✅ Ações rápidas
- ✅ Serviços recentes

## 🚀 Deploy

### Deploy no Vercel
```bash
# Siga o guia completo
cat DEPLOY_GUIDE.md

# Resumo rápido:
# 1. Faça upload para GitHub
# 2. Conecte no Vercel
# 3. Configure variáveis de ambiente
# 4. Deploy automático
```

## 📝 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Inicia servidor de produção
npm run lint         # Verifica código com ESLint
npm run db:push      # Push schema Prisma
npm run db:seed      # Popula banco de dados
npm run db:generate  # Gera Prisma Client
npm run db:migrate   # Roda migrações
npm run db:reset     # Reseta banco de dados
```

## 🔧 Variáveis de Ambiente

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=

# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📖 [Firebase Setup Guide](./FIREBASE_SETUP.md)
- 🚀 [Deploy Guide](./DEPLOY_GUIDE.md)
- 🐛 [Issues no GitHub](https://github.com/SEU_USERNAME/sistema-ordens-servico/issues)

## 🎉 Créditos

Desenvolvido com ❤️ usando tecnologias modernas e melhores práticas.

---

**Sistema de Ordens de Serviço** - Gestão eficiente e profissional para sua oficina! 🛠️