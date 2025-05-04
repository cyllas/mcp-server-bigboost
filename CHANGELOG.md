# Changelog

## 1.0.8 (2025-05-04)

### Melhorias
- Aprimorada a detecção de mensagens do protocolo MCP (JSON-RPC) no filtro de stdout/stderr
- Melhorada a implementação mock do SDK para garantir compatibilidade com Node.js v23.11.0
- Adicionado sistema de log para depuração da implementação mock que escreve em arquivos separados
- Implementado suporte completo a eventos para o servidor mock
- Adicionado processamento de mensagens JSON-RPC recebidas via stdin
- Implementado envio de respostas via stdout
- Adicionado suporte para chamadas de ferramentas (tools) na implementação mock

## 1.0.7 (2025-05-04)

### Correções
- Corrigido problema de mensagens em português interferindo na comunicação JSON do protocolo MCP
- Implementado filtro de stdout/stderr para interceptar mensagens que causam erros de parsing JSON
- Adicionado sistema de detecção de palavras-chave em português para filtragem de logs
- Redirecionamento de mensagens de texto para arquivos de log em vez de stdout/stderr

## 1.0.6 (2025-05-04)

### Melhorias
- Implementado sistema robusto de logs para múltiplas conexões
- Adicionado monitoramento de conexões em tempo real
- Criado utilitário para visualização de logs e estatísticas de conexão
- Interceptação de logs do console para evitar interferência na comunicação do protocolo MCP
- Adicionado rastreamento detalhado de conexões com IDs únicos
- Implementado sistema de logs estruturados em arquivos JSON

## 1.0.5 (2025-05-04)

### Correções
- Corrigido problema de comunicação entre o cliente e o servidor MCP
- Implementação silenciosa do mock do SDK para evitar interferência na comunicação MCP
- Adicionado suporte para comunicação correta entre o cliente e o servidor quando usando a versão mock

## 1.0.4 (2025-05-04)

### Correções
- Corrigido problema de compatibilidade com Node.js v23.11.0
- Melhorado o script de correção de compatibilidade para adicionar o campo "exports" ao package.json do SDK
- Implementação completa da versão mock do SDK para garantir funcionamento em ambientes onde o SDK não pode ser carregado
- Adicionado método `setRequestHandler` às implementações mock
- Removida auto-referência do pacote nas dependências

## 1.0.3 (Data anterior)

### Funcionalidades
- Implementação inicial do servidor MCP para integração com a API Bigboost
- Ferramentas para consulta de pessoas e empresas
- Compatibilidade com Node.js v18.0.0 ou superior
