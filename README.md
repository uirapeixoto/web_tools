# WebTools Dev – Markdown & Mermaid Tools (PT-BR)

Aplicação web leve, focada em **ferramentas de apoio ao desenvolvimento**:

- **Editor Markdown + Mermaid**: criação/edição de arquivos `.md` com pré-visualização ao vivo e suporte a diagramas Mermaid.
- **Laboratório Mermaid + IA**: área dedicada para escrever, validar e (opcionalmente) corrigir diagramas Mermaid usando IA.

Backend em **Node.js + Express**, frontend estático em `public/`, pronto para rodar em **Docker** e ser integrado ao **CasaOS**.

---

## Funcionalidades

- **Página inicial** (`/`):
  - Descrição rápida das ferramentas.
  - Acesso rápido para cada página.

- **Editor Markdown + Mermaid** (`/markdown-editor.html`):
  - Edição de texto Markdown em um painel e pré-visualização no outro.
  - Suporte a blocos de código Mermaid:
    ```markdown
    ```mermaid
    graph TD
      A --> B
    ```
    ```
  - Abertura de arquivos `.md` locais.
  - Download do conteúdo como arquivo `.md`.

- **Laboratório Mermaid + IA** (`/mermaid-lab.html`):
  - Área de texto dedicada ao código Mermaid.
  - **Validação de sintaxe** usando a API do Mermaid no navegador.
  - **Pré-visualização SVG** do diagrama.
  - Botão “**Corrigir com IA**” que envia o código (e o erro, se houver) ao backend:
    - Se a variável `OPENAI_API_KEY` estiver configurada, a API de chat é chamada para sugerir um diagrama Mermaid corrigido.
    - Caso a chave não esteja configurada, uma mensagem amigável é exibida e o código original é preservado.

---

## Estrutura de pastas (resumo)

```text
webtools/
  public/
    index.html                # Página inicial
    markdown-editor.html      # Editor de Markdown + Mermaid
    mermaid-lab.html          # Laboratório Mermaid + IA
    css/
      styles.css              # Layout escuro, responsivo
    js/
      main.js                 # Comportos gerais (nav ativa, etc.)
      markdown-editor.js      # Lógica do editor Markdown
      mermaid-lab.js          # Lógica do laboratório Mermaid
  server.js                   # Servidor Express + endpoint de IA
  package.json
  Dockerfile                  # Multi-stage build (Alpine)
  docker-compose.yml          # Orquestração Docker Compose
  .env                        # Variáveis de ambiente (não versionado)
  README.md
```

---

## Requisitos

- **Node.js** (>= 18 recomendado).
- **npm** (já vem com o Node na maioria das instalações).

Opcional (para rodar em container):

- **Docker** e, se desejar orquestração simples, **Docker Compose**.
- Ambiente com **CasaOS** se quiser adicionar a aplicação como app no sistema.

---

## Instalação e execução local

1. **Clonar ou copiar** este projeto para uma pasta local.

2. Instalar dependências:

   ```bash
   cd webtools
   npm install
   ```

3. (Opcional, mas recomendado) Criar um arquivo `.env` na raiz:

   ```bash
   # Porta do servidor HTTP
   PORT=3000

   # Chave da API OpenAI para correção com IA
   OPENAI_API_KEY=coloque_sua_chave_aqui
   ```

   - Se `OPENAI_API_KEY` não for definida, a aplicação continua funcionando; apenas o botão de IA exibirá mensagens de que a correção não está configurada.

4. Iniciar o servidor:

   ```bash
   npm start
   ```

5. Acessar no navegador:

   - Página inicial: `http://localhost:3000/`
   - Editor Markdown: `http://localhost:3000/markdown-editor.html`
   - Laboratório Mermaid: `http://localhost:3000/mermaid-lab.html`

---

## Endpoint de IA (backend)

O backend expõe um endpoint para correção de diagramas Mermaid:

- **Rota**: `POST /api/mermaid/ai-fix`
- **Body JSON**:

  ```json
  {
    "code": "código mermaid (string)",
    "error": "erro de sintaxe atual (opcional)"
  }
  ```

- **Resposta de sucesso**:

  ```json
  {
    "message": "Código Mermaid corrigido com IA.",
    "fixedCode": "novo código mermaid"
  }
  ```

Se não houver `OPENAI_API_KEY`, o servidor retorna um aviso amigável e **não tenta chamar** a API de IA.

---

## Uso com Docker

O projeto inclui um `Dockerfile` multi-stage (builder + runtime Alpine) e um `docker-compose.yml` prontos para uso.

### Pré-requisitos

- Docker >= 24
- Docker Compose v2 (`docker compose`)

### Build e execução

```bash
# 1. (Opcional) Crie o .env com suas variáveis
cp .env.example .env          # ou edite manualmente
# Defina OPENAI_API_KEY=sk-... se quiser o recurso de IA

# 2. Suba com Docker Compose
docker compose up -d --build

# 3. Acesse
# http://localhost:3000
```

Para parar:

```bash
docker compose down
```

### Build e execução manual (sem Compose)

```bash
docker build -t webtools:latest .

docker run -d \
  --name webtools \
  --restart unless-stopped \
  -p 3000:3000 \
  -e OPENAI_API_KEY=coloque_sua_chave_aqui \
  webtools:latest
```

### Trocar a porta do host

Edite o `.env` antes de subir:

```bash
PORT=8080          # a porta que será exposta no host
```

Ou passe inline:

```bash
PORT=8080 docker compose up -d
```

---

## Integração com CasaOS

### Opção 1 – Via Docker Compose (recomendado)

1. No CasaOS, abra **App Store → Custom Install → Docker Compose**.
2. Cole o conteúdo do `docker-compose.yml` do projeto.
3. Em **Environment Variables**, adicione:
   - `OPENAI_API_KEY` → sua chave (opcional)
   - `PORT` → `3000` (ou outra porta livre no host)
4. Clique em **Install**. O CasaOS fará o build e subirá o container automaticamente.
5. Acesse pelo IP do servidor: `http://<ip-do-casaos>:3000`

### Opção 2 – Imagem já publicada

Se você publicar a imagem em um registry (Docker Hub, GHCR, etc.):

```bash
# Exemplo: publicar no Docker Hub
docker build -t seuusuario/webtools:latest .
docker push seuusuario/webtools:latest
```

No CasaOS, use **Custom Install → Docker** e aponte para `seuusuario/webtools:latest`.

### Dicas CasaOS

| Configuração | Valor sugerido |
|---|---|
| Porta do host | `3000` (ou qualquer porta livre) |
| Porta do container | `3000` |
| Restart policy | `unless-stopped` |
| Variável de ambiente | `OPENAI_API_KEY=<sua chave>` |

Depois de implantado, o app aparece no painel do CasaOS e pode ser acessado normalmente pelo navegador.

---

## Notas e melhorias futuras

- Adicionar autenticação simples (se a aplicação for exposta em ambientes públicos).
- Suporte a mais temas de Mermaid e opções avançadas de configuração.
- Exportação de diagramas em PNG/SVG diretamente da interface.

Sinta-se à vontade para adaptar o layout, adicionar novas ferramentas ou integrar com outros serviços conforme seu fluxo de trabalho. 😊

