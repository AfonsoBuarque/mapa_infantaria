# Mapa Infantaria

Sistema de mapeamento e comunicação em tempo real para operações táticas.

## Funcionalidades

### 1. Sistema de Usuários
- Login com Google
- Status de presença em tempo real
- Visualização de usuários online no mapa
- Atualização automática da posição

### 2. Chat
- Chat em tempo real entre usuários
- Histórico de mensagens
- Limpeza automática após 24 horas
- Interface integrada ao menu lateral

### 3. Histórico de Movimentação
- Rastreamento de movimentação dos usuários
- Visualização de rotas no mapa
- Histórico com limpeza automática após 24 horas
- Filtro por usuário

### 4. Bússola
- Orientação em tempo real
- Calibração automática
- Integração com sensores do dispositivo
- Indicador de direção preciso

### 5. Sistema de Marcações
- Criação de marcadores no mapa
- Compartilhamento em tempo real
- Título e descrição personalizados
- Opções de gerenciamento:
  - Centralizar no mapa
  - Deletar (apenas próprias marcações)
- Limpeza automática após 24 horas

### 6. Menu Lateral
- Interface intuitiva
- Acesso rápido a todas as funcionalidades
- Design responsivo
- Componentes:
  - Chat
  - Histórico de movimentação
  - Sistema de marcações

## Requisitos Técnicos

### Navegador
- Suporte a Geolocalização
- Suporte a DeviceOrientation API
- JavaScript habilitado
- Cookies habilitados

### Permissões Necessárias
- Localização
- Orientação do dispositivo
- Câmera (para calibração da bússola)

### Firebase
- Autenticação Google
- Firestore Database
- Regras de segurança configuradas

## Instalação

1. Clone o repositório
```bash
git clone [URL_DO_REPOSITORIO]
```

2. Configure as credenciais do Firebase em `config.js`
```javascript
const firebaseConfig = {
    // Suas configurações aqui
};
```

3. Instale um servidor local (exemplo: Live Server para VS Code)

4. Execute o projeto no servidor local

## Uso

1. Acesse a aplicação pelo navegador
2. Faça login com sua conta Google
3. Permita o acesso à localização quando solicitado
4. Use o menu lateral para acessar as funcionalidades

## Limpeza Automática

O sistema possui limpeza automática para:
- Mensagens do chat (24 horas)
- Histórico de movimentação (24 horas)
- Marcações no mapa (24 horas)

## Segurança

- Autenticação obrigatória
- Dados criptografados
- Permissões baseadas em usuário
- Proteção contra XSS e injeção de código

## Limitações

- Requer conexão com internet
- Necessita de GPS ativo
- Compatível apenas com navegadores modernos
- Requer permissões do dispositivo

## Suporte

Para suporte ou dúvidas, entre em contato através de:
- Issues no GitHub
- E-mail de suporte

## Contribuição

1. Fork o projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
