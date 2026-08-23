# StepFin

Antes de implementar ou alterar funcionalidades, consulte o contexto privado em
`stepfin-planejamento/`. Esse diretório existe somente no ambiente local e é
ignorado pelo Git.

Ordem mínima de consulta:

1. `stepfin-planejamento/SKILL.md`
2. `stepfin-planejamento/docs/ESTRUTURA.md`
3. `stepfin-planejamento/docs/DEPARA.md`
4. O documento funcional relacionado à tarefa

O código versionado deve ficar em `src/`, `public/` e `supabase/`. O banco
executável deve ser mantido em `supabase/migrations/`; o arquivo em
`stepfin-planejamento/db/` é apenas uma referência consolidada.

Não copie documentos privados de planejamento para arquivos versionados e nunca
grave secrets, senhas ou tokens no repositório.
