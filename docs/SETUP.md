# Configuração do StepFin

## Desenvolvimento local

1. Copie `.env.example` para `.env.local`.
2. Preencha a URL e a chave publicável do projeto Supabase.
3. Execute `npm install` e `npm run dev`.

O arquivo `.env.local` é ignorado pelo Git. Nunca coloque `service_role` no
frontend.

## Secrets das Edge Functions

Cadastre no Supabase antes de ativar as integrações:

- `APP_URL`: endereço público do frontend;
- `OPENROUTER_API_KEY` e `OPENROUTER_MODEL`;
- `GROQ_API_KEY` e `GROQ_MODEL` para fallback;
- `RESEND_API_KEY` e `RESEND_FROM`;
- `CRON_SECRET`, usado pelos jobs internos;
- `EVOLUTION_WEBHOOK_SECRET`, se o WhatsApp for habilitado.

O Supabase injeta automaticamente `SUPABASE_URL`, `SUPABASE_ANON_KEY` e
`SUPABASE_SERVICE_ROLE_KEY` nas Edge Functions.

## Banco

As migrations ficam em `supabase/migrations`. O schema possui 17 tabelas com
RLS, RPCs transacionais e três buckets privados. O histórico local está
alinhado às versões aplicadas no projeto remoto.

## Automações

As funções `send-due-alerts` e `goal-progress-check` validam o cabeçalho
`x-cron-secret`. Agende-as somente depois de cadastrar `CRON_SECRET`. O
WhatsApp é opcional e permanece desabilitado até a configuração da Evolution
API e de um número remetente.

## Validação antes de publicar

Execute `npm run lint` e `npm run build`.
