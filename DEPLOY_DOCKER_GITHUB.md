# Deploy em Produção com GitHub Actions + Docker (GHCR)

Este guia descreve o fluxo de deploy usando:
- GitHub Actions para buildar e publicar a imagem
- GitHub Container Registry (GHCR) para armazenar a imagem
- Servidor Linux com Docker/Compose para rodar a aplicação

## Visão geral
1. Ao fazer `git push` na branch `main`, o workflow `.github/workflows/deploy.yml`:
   - Builda a imagem Docker do app.
   - Publica em `ghcr.io/<owner>/liontech-os:latest`.
   - Conecta via SSH no servidor e executa `docker compose pull && docker compose up -d`.
2. O servidor mantém a sessão do WhatsApp Web no volume `./db/whatsapp-web-session`.
3. O app roda em `PORT=3000` e escuta em `HOST=0.0.0.0`.

## Pré-requisitos
- Repositório no GitHub com este projeto.
- Servidor Linux com Docker e Docker Compose Plugin instalados.
- Porta `3000` liberada (ou proxy reverso/HTTPS por Nginx).

## Secrets do GitHub (Actions)
Crie os seguintes secrets em `Settings → Secrets and variables → Actions`:
- `SSH_HOST`: host do servidor (ex.: `seu.dominio.com` ou IP).
- `SSH_USER`: usuário SSH.
- `SSH_KEY`: chave privada (conteúdo do `~/.ssh/id_rsa`).
- `SSH_PORT`: porta SSH (ex.: `22`).
- `SERVER_APP_DIR`: diretório remoto (ex.: `/opt/liontech-os`).
- `GHCR_USER`: seu usuário GitHub.
- `GHCR_TOKEN`: token do GitHub com `read:packages` para `docker login` no servidor.

> Observação: o job de build/push usa automaticamente `GITHUB_TOKEN`. Os secrets acima são usados apenas no job de deploy remoto.

## Setup inicial no servidor (uma vez)
1. Crie a pasta da aplicação e dê permissão:
   ```bash
   sudo mkdir -p /opt/liontech-os && sudo chown $(whoami) /opt/liontech-os
   cd /opt/liontech-os
   ```
2. Faça login no GHCR:
   ```bash
   echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
   ```
3. Crie o arquivo `.env.production` com base em `.env.production.example` do repositório:
   - Preencha variáveis do Firebase, `AUTH_SECRET`, etc.
   - Defina `GHCR_IMAGE=ghcr.io/<owner>/liontech-os:latest`.
4. Copie o `docker-compose.yml` do repositório para o servidor (se preferir via `scp`):
   ```bash
   scp docker-compose.yml user@server:/opt/liontech-os/docker-compose.yml
   ```
5. Suba a aplicação pela primeira vez:
   ```bash
   docker compose up -d
   ```

## Deploy automático (após cada push na main)
- O workflow irá:
  - Buildar e publicar a imagem no GHCR.
  - Acessar o servidor por SSH e executar `docker compose pull && docker compose up -d` no `SERVER_APP_DIR`.

## Testes pós-deploy
- Abra `http://<host>:3000/`.
- `GET /api/whatsapp-web/qr` → `state: loading/qr/connected`.
- Se `state: qr`, escaneie com o app do WhatsApp.
- `POST /api/whatsapp-web/send` → 200 (ok), 409 (cliente não pronto), 422 (número inválido).

## Dicas
- Mantemos `WA_HEADLESS=true` em produção para estabilidade.
- O bind `HOST=0.0.0.0` permite acesso externo dentro de containers.
- Use proxy reverso (Nginx) para HTTPS; peça um bloco pronto se precisar.

## Persistência de uploads
- O `docker-compose.yml` inclui o volume `./public/uploads:/app/public/uploads` para persistir logos e arquivos públicos.
- Logos enviados via `/api/uploads/logo` são salvos em `public/uploads/logos` e servidos como `/uploads/logos/<arquivo>`.
- Se ver `404` para imagens, confira se o volume está montado e o arquivo existe em `public/uploads/logos` no servidor.

## WhatsApp Web em serverless
- Em ambientes serverless (ex.: Vercel), o WhatsApp Web é desativado automaticamente. A rota `GET /api/whatsapp-web/qr` retornará `503`.
- Para desativar manualmente em qualquer ambiente, defina `DISABLE_WHATSAPP_WEB=true` no `.env`.
- Use o modo Cloud:
  - `POST /api/whatsapp/send` para enviar mensagens usando a Cloud API.
  - `GET /api/whatsapp/test` e `GET /api/whatsapp/diagnostics` para validar configuração.

## Troubleshooting
- **Deploy job falhou**: verifique se os secrets estão configurados e se o `SERVER_APP_DIR` contém `docker-compose.yml` e `.env.production`.
- **Chromium não inicia**: garanta que o servidor é x86_64 com as libs instaladas; esta imagem inclui dependências padrão.
- **WhatsApp desconecta**: a sessão persiste em `db/whatsapp-web-session`; reinícios não exigem novo login.
- **QR 503**: o WhatsApp Web está desativado (serverless ou `DISABLE_WHATSAPP_WEB=true`). Utilize o modo Cloud.
- **Imagem 404**: verifique o volume `public/uploads` e a existência do arquivo em `public/uploads/logos`.