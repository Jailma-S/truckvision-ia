# TruckVision IA

> Enxergue hoje as oportunidades de amanhã

Plataforma de inteligência comercial que transforma sinais públicos de mercado em oportunidades priorizadas (IAC) para venda de caminhões novos. Escopo inicial: Maranhão.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # opcional
npm run dev
```

Sem variáveis do Supabase o app roda em **modo demonstração**: 10 empresas e 14 sinais **fictícios** em memória (reiniciar o servidor apaga o que foi cadastrado).
Sem chave de IA, resumos/briefings são montados por regra e o chat mostra só o ranking.

## Ligar o Supabase

1. Crie o projeto em supabase.com.
2. SQL Editor → rode `supabase/migrations/0001_init.sql` e depois `supabase/seed.sql`.
3. Authentication → URL Configuration → adicione `http://localhost:3000/auth/callback` e a URL da Vercel.
4. Preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`.

Acesso: por padrão o link é **aberto, sem login** (como o PCP 360°) e o servidor usa a service role. Qualquer pessoa com o link lê e edita os dados.
Antes de carregar dados reais, defina `AUTH_REQUIRED=true`: o login passa a ser por link mágico no e-mail e as telas exigem usuário autenticado (RLS: `authenticated`).

## IA

`AI_PROVIDER` = `anthropic` (padrão) | `openai` | `azure` | `gemini`. `AI_MODEL` sobrescreve o modelo.
Padrão Anthropic: `claude-opus-5-5`, com fallback automático do servidor em caso de recusa. Para custo menor, `AI_MODEL=claude-sonnet-5-5`.

| Módulo PRD | Onde |
|---|---|
| IA 01 Resumo + IA 07 Relevância | `src/application/use-cases/register-signal.ts` |
| IA 02/03/05 Justificativa, IAC, abordagem | `generate-analysis.ts` (kind `justification`) |
| IA 04 Chat | `chat.ts` |
| IA 06 Briefing | `generate-analysis.ts` (kind `briefing`) |
| IA 08 Agente de monitoramento | `monitor-sources.ts` + `/api/agent/monitor` (Vercel Cron, diário) |

O agente lê o `feed_url` (RSS/Atom) das fontes ativas na tabela `sources`. Cadastre os feeds após validar cada endereço.

## IAC

Regra em `src/domain/rules/iac.ts`: contrato 25 · expansão 30 · investimento 20 · fonte confiável 15 · recência 10.
Faixas: 80–100 alta · 50–79 média · 0–49 exploratório. Sinais de relevância baixa ou com mais de 180 dias não pontuam.

## Arquitetura

```
src/app            telas (App Router) e rotas
src/features       server actions e componentes de formulário/chat
src/components     UI reutilizável
src/application    casos de uso e prompts
src/domain         entidades, regra do IAC, interface de repositório
src/infrastructure supabase, demo (memória), ai (provedores), crawlers (RSS)
```

## Deploy (Vercel)

GitHub → importar na Vercel → configurar as variáveis do `.env.example` (incluindo `CRON_SECRET`).
`main` → produção, `develop` → preview.
