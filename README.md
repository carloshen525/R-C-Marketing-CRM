# R&C Marketing CRM 🚀

Sistema SaaS Multi-Tenant avançado para **Rastreamento de Meta Ads + WhatsApp + CRM Kanban + Conversions API (CAPI)**, projetado com dois ambientes completamente isolados:

1. **Painel Master (Administrador R&C Marketing)** — Controle exclusivo de clientes, subdomínios, tokens Meta Ads CAPI e instâncias dedicadas da Evolution API.
2. **Painel do Cliente (Empresa Contratante)** — Ambiente simplificado acessado via subdomínio (ex: `terraesilva.rcmarketingcrm.com.br`) com CRM, WhatsApp, Leads, Vendas, Relatórios e Status Seguro de Integrações.

---

## 🎯 A Jornada de Conversão 100% Nativa (Sem n8n)

$$\text{Meta Ads (CTWA)} \longrightarrow \text{WhatsApp} \longrightarrow \text{Evolution API Webhook} \longrightarrow \text{CRM} \longrightarrow \text{Venda Fechada} \longrightarrow \text{Purchase (CAPI)}$$

1. **Anúncio Click-to-WhatsApp (CTWA)**: O webhook nativo do CRM recebe o webhook da Evolution API e extrai:
   - `ctwa_clid`, `source_id`, `ad_id`, telefone, nome e plataforma.
2. **Enriquecimento via Meta Graph API**: Consulta automaticamente nome da campanha, conjunto e anúncio exatos que geraram a mensagem.
3. **LeadSubmitted Automático**: Enviado à Meta via CAPI apenas na criação do lead (idempotente — bloqueado contra reenvios em conversas futuras).
4. **Operação no CRM**: O operador atende o lead e o conduz pelo funil.
5. **Venda Concluída**: Ao mover o card para a etapa de ganho, **abre obrigatoriamente o modal "Registrar Venda"** (Cliente, Telefone, Produto, Valor BRL, Data, Checkbox *"☑ Enviar conversão para Meta Ads"*).
6. **Disparo do Purchase para a Meta**: Ao confirmar, a venda é salva, o faturamento registrado e o evento `Purchase` é despachado via Conversions API utilizando as credenciais configuradas no Painel Master.
7. **Lead Orgânico**: Caso o lead não possua `ctwa_clid`, o CRM funciona normalmente com a mensagem *"Lead orgânico - sem rastreamento Meta"* e o envio de Purchase permanece desabilitado para proteger as métricas de ROAS.

---

## 🛡️ 1. Painel Master — Administrador R&C Marketing

Acesso restrito à equipe interna da R&C Marketing (`/master`).

### Funcionalidades:
- **Dashboard Geral SaaS**: MRR total, empresas ativas vs suspensas, total de leads rastreados, vendas registradas, faturamento movimentado pelos clientes e feed ao vivo de eventos CAPI.
- **Cadastro Completo de Empresas**:
  - *Informações*: Nome da empresa, Nome fantasia, Responsável, E-mail, WhatsApp, Plano (Starter, Pro, Enterprise), Status (Ativa, Pendente, Suspensa).
  - *Subdomínio Exclusivo*: Geração automática com suporte a edição manual e validação de disponibilidade (ex: `terraesilva.rcmarketingcrm.com.br`).
  - *Primeiro Administrador*: Geração automática do primeiro usuário da empresa com senha temporária, instrução de troca no primeiro acesso e botão para copiar dados de acesso.
- **Configuração Técnica da Evolution API (Centralizada)**:
  - URL da API, API Key, Nome da instância (`terraesilva`, `guinchoharley`, etc.), status da conexão, leitura de QR Code, reinicialização e desconexão.
- **Configuração Técnica Meta Ads (Centralizada)**:
  - Token permanente Meta (System User), Pixel ID, Dataset ID, Page ID, Webhook Secret, Graph API Version (`v20.0`) e Test Event Code.
- **Gestão de Contas**: Suspender, reativar, editar ou excluir empresas contratantes.
- **Impersonation**: Acesso direto com 1 clique ao Painel do Cliente como qualquer empresa.

---

## 🏢 2. Painel do Cliente (Empresa Contratante)

Cada empresa possui um ambiente isolado acessado pelo seu subdomínio:
- Exemplo: `https://terraesilva.rcmarketingcrm.com.br` ou `https://guinchoharley.rcmarketingcrm.com.br`

### Menus do Cliente:
- **Dashboard**: Métricas do dia e do mês, faturamento, ticket médio, taxa de conversão, gráficos diários e ranking de campanhas/anúncios que mais geraram faturamento.
- **CRM Kanban**: Colunas padrão (*Novos Leads*, *Atendimento*, *Negociação*, *Pagamento*, *Venda Concluída*, *Perdidos*) com drag-and-drop, filtros e Drawer lateral com dados completos, chat do WhatsApp, histórico e auditoria.
- **Conversas WhatsApp**: Caixa de entrada interativa em tempo real alimentada pela instância dedicada da empresa na Evolution API.
- **Status das Integrações (Modo Cliente)**:
  - Visualização simplificada e segura:
    - **WhatsApp**: Conectado 🟢 Online • Última sincronização • Ações: *Reconectar*, *Atualizar QR Code*, *Solicitar suporte*.
    - **Meta Ads**: Conectado 🟢 • Rastreamento ativo • Quantidade de leads rastreados • Compras enviadas • Última conversão enviada.
  - **O CLIENTE NUNCA VISUALIZA**: Token da Meta, API Key da Evolution, URL da Evolution, Pixel ID, Dataset ID, Webhook Secret, chaves de acesso ou dados de outros clientes.
- **Relatórios**: Performance de campanhas, criativos, atendentes e exportação em formato CSV.

---

## 🗄️ Banco de Dados & RLS (Supabase)

Migrations SQL disponíveis em `supabase/migrations/`:
1. `20260101000000_rc_marketing_crm_schema.sql` (Schema base Multi-Tenant + RLS)
2. `20260102000000_rc_marketing_master_saas.sql` (Estrutura SaaS Master, subdomínios, planos e políticas de superadmin)

---

## 🚀 Como Iniciar

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Executar o projeto:
   ```bash
   npm run dev
   ```
   Acesse: [http://localhost:3000](http://localhost:3000)

3. Validar a build de produção:
   ```bash
   npm run build
   ```
