# Changelog

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
