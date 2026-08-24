# StepFin

PWA de finanças pessoais e familiares com grupos compartilhados, lançamentos,
contas, cartões, caixinhas, relatórios e assistência financeira por IA.

## Stack

- React 19, TypeScript e Vite;
- PWA com service worker;
- Supabase PostgreSQL, Auth, Storage e Edge Functions;
- OpenRouter como IA principal e Groq como fallback;
- Resend para e-mail e integração opcional com Evolution API.

## Começar

Copie `.env.example` para `.env.local`, preencha as variáveis publicáveis do
Supabase e execute:

- `npm install`
- `npm run dev`

Detalhes de banco, secrets e automações estão em [docs/SETUP.md](docs/SETUP.md).

## Qualidade

- `npm run lint`
- `npm run build`

Nunca versione `.env.local`, chaves de service role ou secrets de integrações.
