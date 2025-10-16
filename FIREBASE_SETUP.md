# 📋 Guia de Configuração do Firebase

Este guia irá ajudá-lo a configurar o Firebase para o Sistema de Ordens de Serviço passo a passo.

## 🔥 Passo 1: Criar Projeto no Firebase

1. **Acesse o Firebase Console**
   - Vá para [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Faça login com sua conta Google

2. **Crie um novo projeto**
   - Clique em "Adicionar projeto"
   - Dê um nome ao seu projeto (ex: `sistema-os-2024`)
   - Aceite os termos e clique em "Continuar"
   - Escolha se deseja ou não o Google Analytics (opcional)
   - Clique em "Criar projeto"

## 🔑 Passo 2: Configurar Autenticação

1. **Ative a Autenticação**
   - No menu lateral, vá para "Authentication"
   - Clique em "Começar"
   - Na aba "Método de login", ative:
     - **Email/Senha**: Ative e salve
     - **Google**: Ative, configure o consentimento e salve

2. **Configure usuários de teste**
   - Você pode criar usuários manualmente na aba "Usuários"
   - Ou usar o próprio sistema de login quando estiver funcionando

## 📊 Passo 3: Configurar Firestore Database

1. **Crie o banco de dados**
   - No menu lateral, vá para "Firestore Database"
   - Clique em "Criar banco de dados"
   - Escolha "Iniciar em modo de teste" (para desenvolvimento)
   - Escolha um local para os dados (recomendado: `southamerica-east1`)
   - Clique em "Criar"

2. **Configure as regras de segurança**
   - No Firestore, vá para a aba "Regras"
   - Para desenvolvimento, use:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 📁 Passo 4: Configurar Storage (Opcional)

1. **Ative o Storage**
   - No menu lateral, vá para "Storage"
   - Clique em "Começar"
   - Escolha "Iniciar em modo de teste"
   - Use o mesmo local do Firestore
   - Clique em "Concluir"

## ⚙️ Passo 5: Obter Credenciais

1. **Configuração do Firebase**
   - No Firebase Console, clique no ícone de engrenagem ⚙️
   - Vá para "Configurações do projeto"
   - Na aba "Geral", role até "Seus aplicativos"
   - Clique em "Web" (</>) para criar um novo app
   - Dê um apelido (ex: "Sistema OS Web")
   - Clique em "Registrar app"
   - **Copie as credenciais** que aparecem na tela

2. **Chaves de serviço (Firebase Admin)**
   - Na aba "Contas de serviço", clique em "Gerar nova chave privada"
   - Escolha "Firebase Admin SDK"
   - Clique em "Gerar chave"
   - **Baixe o arquivo JSON** - ele contém as chaves necessárias

## 🔧 Passo 6: Configurar Variáveis de Ambiente

1. **Abra o arquivo `.env.local`** na raiz do projeto

2. **Substitua os valores placeholder** com suas credenciais:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=sua_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=sua_measurement_id

# Firebase Admin Configuration
FIREBASE_PROJECT_ID=seu_project_id
FIREBASE_CLIENT_EMAIL=seu_email_de_servico
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua_chave_privada_aqui\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=seu_project_id.appspot.com
```

3. **Onde encontrar cada valor:**
   - **API Key, Auth Domain, Project ID, etc**: Na configuração do app web (Passo 5.1)
   - **Client Email**: No arquivo JSON baixado (campo `client_email`)
   - **Private Key**: No arquivo JSON baixado (campo `private_key`)
   - **Project ID**: Mesmo valor em ambos os casos

## 🚀 Passo 7: Testar a Configuração

1. **Inicie o projeto**
   ```bash
   npm run dev
   ```

2. **Teste o login**
   - Acesse `http://localhost:3000`
   - Tente criar uma nova conta com email e senha
   - Ou faça login com Google

3. **Verifique o console**
   - Abra o console do navegador (F12)
   - Verifique se há erros de configuração do Firebase

## 🐛 Solução de Problemas Comuns

### Erro: "Firebase: No Firebase App '[DEFAULT]' has been created"
- **Causa**: Variáveis de ambiente não configuradas
- **Solução**: Verifique se o `.env.local` está preenchido corretamente

### Erro: "auth/invalid-api-key"
- **Causa**: API Key inválida ou ausente
- **Solução**: Verifique a `NEXT_PUBLIC_FIREBASE_API_KEY`

### Erro: "auth/project-not-found"
- **Causa**: Project ID incorreto
- **Solução**: Verifique o `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

### Erro: "permission-denied"
- **Causa**: Regras de segurança do Firestore
- **Solução**: Verifique as regras no Firestore Console

## 📱 Próximos Passos

Após configurar o Firebase:

1. **Teste todas as funcionalidades**
   - Login/Logout
   - Criação de usuários
   - Acesso às páginas protegidas

2. **Configure o ambiente de produção**
   - Mude as regras do Firestore para produção
   - Configure domínios autorizados no Authentication

3. **Prepare para o deploy**
   - Configure as variáveis de ambiente no Vercel
   - Teste o build: `npm run build`

## 🎉 Parabéns!

Seu Firebase está configurado e pronto para uso com o Sistema de Ordens de Serviço!

---

**Dica**: Mantenha suas chaves de serviço seguras e nunca as commit em repositórios públicos.