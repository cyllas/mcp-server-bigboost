# mcp-server-bigboost

Servidor MCP (Model Context Protocol) para integração com a API Bigboost da Bigdatacorp. Este servidor permite que modelos de linguagem como o Claude possam acessar dados da Bigboost API de forma padronizada, permitindo consultas de dados de pessoas físicas e empresas através de diferentes parâmetros de busca.

O servidor segue os padrões SOLID e SDR, com variáveis, classes e métodos em inglês usando camelCase, e índices no elasticsearch em inglês usando snake_case.

## Requisitos

- Node.js 18 ou superior
- npm ou yarn
- Credenciais de acesso à API Bigboost (AccessToken e TokenId)

## Estrutura do Projeto

```
mcp-server-bigboost/
├── src/
│   ├── config/                    # Configurações
│   ├── constants/                 # Constantes
│   ├── services/                  # Serviços
│   ├── tools/                     # Ferramentas MCP
│   ├── types/                     # Definições de tipos
│   ├── utils/                     # Utilitários
│   ├── server.ts                  # Configuração do servidor
│   └── index.ts                   # Ponto de entrada
├── tests/                         # Testes
├── .env.example                   # Exemplo de variáveis de ambiente
└── README.md                      # Documentação
```

## Configuração

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Copie o arquivo `.env.example` para `.env` e configure suas credenciais:
   ```
   cp .env.example .env
   ```
   ```
   BIGBOOST_ACCESS_TOKEN=seu-access-token
   BIGBOOST_TOKEN_ID=seu-token-id
   ```

## Execução

O servidor MCP funciona exclusivamente no modo stdio, usado para integração direta com modelos de linguagem como o Claude:

```bash
npm start
```

## Ferramentas Disponíveis

### 1. Consultas de Pessoas Físicas

#### 1.1. consultaPessoa

Consulta dados básicos de uma pessoa física a partir do CPF.

**Parâmetros:**
- `cpf`: Número do CPF (com ou sem pontuação)

**Exemplo de uso:**
```javascript
// No Claude Desktop
const resultado = await mcp.consultaPessoa({ cpf: "${CPF_EXEMPLO}" });

// Em outros clientes MCP
const response = await fetch("http://localhost:3000/mcp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "consultaPessoa",
    parameters: { cpf: "${CPF_EXEMPLO}" }
  })
});
const resultado = await response.json();
```

#### 1.2. consultaPessoaTelefone

Consulta dados básicos de uma pessoa física a partir do número de telefone.

**Parâmetros:**
- `telefone`: Número de telefone (com ou sem pontuação)

**Exemplo de uso:**
```javascript
// No Claude Desktop
const resultado = await mcp.consultaPessoaTelefone({ telefone: "${TELEFONE_EXEMPLO}" });

// Em outros clientes MCP
const response = await fetch("http://localhost:3000/mcp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "consultaPessoaTelefone",
    parameters: { telefone: "${TELEFONE_EXEMPLO}" }
  })
});
const resultado = await response.json();
```

#### 1.3. consultaPessoaEmail

Consulta dados básicos de uma pessoa física a partir do endereço de email.

**Parâmetros:**
- `email`: Endereço de email válido

**Exemplo de uso:**
```javascript
// No Claude Desktop
const resultado = await mcp.consultaPessoaEmail({ email: "${EMAIL_EXEMPLO}" });

// Em outros clientes MCP
const response = await fetch("http://localhost:3000/mcp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "consultaPessoaEmail",
    parameters: { email: "${EMAIL_EXEMPLO}" }
  })
});
const resultado = await response.json();
```

### 2. Consultas de Empresas

#### 2.1. consultaEmpresa

Consulta dados básicos de uma empresa a partir do CNPJ.

**Parâmetros:**
- `cnpj`: Número do CNPJ (com ou sem pontuação)

**Exemplo de uso:**
```javascript
// No Claude Desktop
const resultado = await mcp.consultaEmpresa({ cnpj: "${CNPJ_EXEMPLO}" });

// Em outros clientes MCP
const response = await fetch("http://localhost:3000/mcp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "consultaEmpresa",
    parameters: { cnpj: "${CNPJ_EXEMPLO}" }
  })
});
const resultado = await response.json();
```

#### 2.2. consultaQsa

Consulta o Quadro Societário e Administrativo (QSA) de uma empresa a partir do CNPJ.

**Parâmetros:**
- `cnpj`: Número do CNPJ (com ou sem pontuação)

**Exemplo de uso:**
```javascript
// No Claude Desktop
const resultado = await mcp.consultaQsa({ cnpj: "${CNPJ_EXEMPLO}" });

// Em outros clientes MCP
const response = await fetch("http://localhost:3000/mcp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "consultaQsa",
    parameters: { cnpj: "${CNPJ_EXEMPLO}" }
  })
});
const resultado = await response.json();
```

#### 2.3. consultaRegistroEmpresa

Consulta dados completos de registro de uma empresa a partir do CNPJ, incluindo endereços e contatos.

**Parâmetros:**
- `cnpj`: Número do CNPJ (com ou sem pontuação)

**Exemplo de uso:**
```javascript
// No Claude Desktop
const resultado = await mcp.consultaRegistroEmpresa({ cnpj: "${CNPJ_EXEMPLO}" });

// Em outros clientes MCP
const response = await fetch("http://localhost:3000/mcp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "consultaRegistroEmpresa",
    parameters: { cnpj: "${CNPJ_EXEMPLO}" }
  })
});
const resultado = await response.json();
```

## Limitações

- Limite de 5000 requisições a cada 5 minutos por IP
- As requisições devem ser distribuídas homogeneamente
- Timeout de 30 segundos para cada requisição
- Datasets restritos podem retornar a mensagem "DATASET UNAVAILABLE"
- Alguns parâmetros podem ser obrigatórios, semi-obrigatórios ou opcionais

## Desenvolvimento

### Compilação

```
npm run build
```

### Execução em modo de desenvolvimento

```
npm run dev
```

### Solução de problemas

#### Erro com o pacote @modelcontextprotocol/sdk

Se você encontrar erros relacionados ao pacote `@modelcontextprotocol/sdk`, como:

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in node_modules/@modelcontextprotocol/sdk/package.json
```

ou

```
Cannot find module '@modelcontextprotocol/sdk' or its corresponding type declarations
```

Tente as seguintes soluções:

1. Usar uma versão específica do Node.js (recomendado: v18.x):
   ```
   nvm use 18
   ```

2. Reinstalar o pacote MCP SDK:
   ```
   npm uninstall @modelcontextprotocol/sdk
   npm install @modelcontextprotocol/sdk@1.10.0
   ```

3. Limpar o cache do npm:
   ```
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

### Testes

```
npm test
```

### Lint

```
npm run lint
```

## Características Técnicas

- Implementação seguindo os princípios SOLID e SDR
- Tratamento adequado para os códigos de status da API:
  - Códigos -100 a -999: relacionados aos dados de entrada
  - Códigos -1000 a -1199: relacionados a problemas de login
  - Códigos -1200 a -1999: relacionados a problemas internos nas APIs ou datasets
  - Códigos -2000 a -2999: relacionados às consultas on-demand
  - Códigos -3000 em diante: relacionados a problemas na API de Monitoramento ou Chamadas Assíncronas
- Controle de limite de requisições
- Suporte a tags de chamada (limitado a 10 tags por requisição)
- Tratamento para datasets restritos
- Validação de parâmetros de consulta
- Retorno dos dados brutos da API, sem transformações adicionais

## Integração com Clientes

### Integração com o Windsurf

Para utilizar este servidor com o Windsurf (Claude Desktop), você precisa configurá-lo no arquivo `mcp_config.json`:

1. Instale o pacote do servidor:
   ```bash
   npm install -g mcp-server-bigboost
   ```

2. Adicione a configuração ao arquivo `~/.codeium/windsurf/mcp_config.json`:
   ```json
   {
     "mcpServers": {
       "bigboost-mcp-server": {
         "command": "npx",
         "args": [
           "-y",
           "mcp-server-bigboost"
         ],
         "env": {
           "BIGBOOST_ACCESS_TOKEN": "seu-access-token",
           "BIGBOOST_TOKEN_ID": "seu-token-id"
         }
       }
     }
   }
   ```

3. Reinicie o Windsurf para que as alterações sejam aplicadas.

4. Utilize as ferramentas diretamente no prompt do Claude:
   ```
   Por favor, consulte o CPF ${CPF_EXEMPLO} usando a ferramenta consultaPessoa.
   ```

### Integração com Claude e outros modelos de linguagem

Para utilizar este servidor com o Claude ou outros modelos de linguagem:

1. Inicie o servidor:
   ```bash
   npm start
   ```

2. Configure o Claude para usar o servidor como uma ferramenta externa via MCP:
   - No Claude Desktop, adicione o servidor como uma ferramenta externa
   - No Claude Web, configure a integração com o servidor MCP

### Exemplo de uso direto no Claude

```
Usuário: Consulte o CPF ${CPF_EXEMPLO} para mim.

Claude: Vou consultar esse CPF para você usando a ferramenta consultaPessoa.

[Claude usa a ferramenta consultaPessoa com o parâmetro CPF]

Aqui estão os resultados da consulta para o CPF ${CPF_EXEMPLO}:

Nome: João da Silva
Data de Nascimento: 15/05/1980
Situação do CPF: Regular
...
```

## Códigos de Status e Tratamento de Erros

O servidor MCP retorna os códigos de status da API Bigboost no campo `status` da resposta. Verifique sempre este campo para garantir que a consulta foi bem-sucedida.

Exemplo de resposta com sucesso:
```json
{
  "result": [...],
  "status": {
    "doc_finder": [
      {
        "Code": 0,
        "Message": "OK"
      }
    ],
    "basic_data": [
      {
        "Code": 0,
        "Message": "OK"
      }
    ]
  },
  "queryId": "...",
  "elapsedMilliseconds": 123,
  "queryDate": "..."
}
```
