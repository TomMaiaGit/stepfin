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

## Membros e convites

O titular pode reenviar ou cancelar convites pendentes e remover o acesso de
membros. A remoção é lógica: o vínculo fica inativo e o histórico financeiro é
preservado. Um convite aceito posteriormente reativa o vínculo existente.

O botão **Copiar link** renova o token e a validade por sete dias. O titular
pode enviar esse link manualmente pelo WhatsApp; somente uma conta autenticada
com o e-mail convidado poderá aceitá-lo. Essa modalidade requer apenas
`APP_URL=https://stepfin.pages.dev` nas secrets das Edge Functions.

O envio automático por e-mail permanece opcional. Quando houver domínio
próprio verificado, configure também `RESEND_API_KEY` e `RESEND_FROM`.

## Automações

As funções `send-due-alerts` e `goal-progress-check` validam o cabeçalho
`x-cron-secret`. Agende-as somente depois de cadastrar `CRON_SECRET`. O
WhatsApp é opcional e permanece desabilitado até a configuração da Evolution
API e de um número remetente.

## Validação antes de publicar

Execute `npm run lint` e `npm run build`.
