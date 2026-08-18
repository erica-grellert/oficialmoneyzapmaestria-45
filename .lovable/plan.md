# Importador de Extrato Bancário — Fase 1 (PDF, CSV, XLSX, OFX)

## Coluna de entidade (confirmado no banco)

- `moneyzap_transactions.entidade` — **singular**, `smallint`, NOT NULL, default `1` (1 = Pessoal, 2 = Empresarial)
- `moneyzap_categories.entidades` — **plural**, `smallint[]`, NOT NULL, default `{1}`

Filtros: `.eq('entidade', n)` para transações, `.contains('entidades', [n])` para categorias.

## Regras de negócio

- Nada entra em `moneyzap_transactions` fora do clique de confirmação final na tela de conferência. Todo arquivo (inclusive o resultado da IA no PDF) cai no staging.
- Conciliação: mesmo usuário, mesma direção, valor igual ou com diferença de até R$ 5,00 **ou** 3%, data em ±3 dias → linha marcada como possível duplicata, desmarcada, com escolha manual entre conciliar ou importar como nova.
- Ao conciliar: mantém o registro original, grava `original_amount` e `original_description`, atualiza valor/data/descrição com o dado do banco e marca `reconciled_at`. Se `reconciled_at` já estiver preenchido, não sobrescreve de novo.
- Candidatos de conciliação filtram `reconciled_at IS NULL` e `user_id IS NOT NULL`.
- Transação com `goal_id` preenchido não pode ser conciliada nesta fase: some a ação "Conciliar" e aparece o aviso "lançamento vinculado a uma meta, importe como novo ou ajuste manualmente". `update_goal_amount` não é chamada neste fluxo.
- Entidade padrão do lote vem do toggle Pessoal/Empresarial na tela de upload, editável linha a linha.
- Reuso obrigatório: bucket `uploads`, tabela `moneyzap_uploads`, funções `register_upload`, `generate_upload_path`, `validate_file_type`. Nada disso é recriado.

## Migração (SQL a aprovar)

### `moneyzap_statement_imports`
`id uuid PK`, `user_id uuid NOT NULL`, `upload_id uuid → moneyzap_uploads(id) ON DELETE SET NULL`, `file_name text`, `file_hash text`, `file_format text CHECK IN ('csv','xlsx','ofx','pdf')`, `entidade_default smallint default 1`, `status text default 'pending' CHECK IN ('pending','reviewing','completed','discarded')`, `period_start/period_end date`, `total_rows/imported_rows/skipped_rows/reconciled_rows integer default 0`, `opening_balance numeric`, `closing_balance numeric`, `balance_check_diff numeric`, `created_at/updated_at`.

Índices: `UNIQUE (user_id, file_hash)` (mesmo arquivo reenviado abre o import existente), `(user_id, created_at DESC)`.

### `moneyzap_statement_lines` (staging)
`id`, `import_id → statement_imports ON DELETE CASCADE`, `user_id`, `row_index`, `raw_line jsonb`, `line_hash text`, **`occurrence integer NOT NULL DEFAULT 1`**, `fitid text NULL`, `posted_at date`, `description_raw text`, `merchant_key text`, **`amount numeric NOT NULL CHECK (amount > 0)`**, `direction text CHECK IN ('income','expense')`, `entidade smallint default 1`, `suggested_category_id uuid → categories`, `category_id uuid → categories`, `match_status text default 'new' CHECK IN ('new','possible_duplicate','reconciled','imported','ignored')`, `match_transaction_id uuid → transactions`, `match_score numeric`, `match_reason jsonb`, `selected boolean default false`, `created_transaction_id uuid → transactions`, `created_at/updated_at`.

Índices (dedup corrigida):
- **`UNIQUE (user_id, line_hash, occurrence)`** — permite dois cafés de R$ 12 no mesmo dia na mesma padaria sem estourar constraint
- `UNIQUE (user_id, fitid) WHERE fitid IS NOT NULL` — inalterado
- `(import_id, match_status)`, `(user_id, posted_at)`

`line_hash` = SHA-256 de `posted_at + amount + direction + merchant_key`.

### `moneyzap_merchant_rules`
`id`, `user_id`, `merchant_key text`, `category_id uuid → categories ON DELETE CASCADE`, `entidade smallint`, `direction text`, `hit_count integer default 1`, `last_used_at`, `created_at/updated_at`.
Índices: `UNIQUE (user_id, merchant_key, entidade, direction)`, `(user_id, merchant_key)`.

### `moneyzap_transactions` (colunas novas, todas nullable)
`reconciled_at timestamptz`, `statement_line_id uuid`, `import_id uuid`, `original_amount numeric`, `original_description text`.
Índice: `(user_id, date, type)` para acelerar a busca de candidatos.

### RLS
Nas três tabelas novas: `GRANT` para `authenticated` e `service_role` (nunca `anon`), RLS ligada e políticas de SELECT/INSERT/UPDATE/DELETE com `auth.uid() = user_id`. Em `statement_lines` o INSERT também valida que o `import_id` pertence ao usuário.

## Deduplicação por ocorrência

```text
ocorrencias_no_arquivo = contagem de linhas com o mesmo line_hash no arquivo atual
ja_existentes = SELECT count(*) FROM statement_lines WHERE user_id = me AND line_hash = h

para a i-ésima ocorrência (i começando em 1) do hash h no arquivo:
    occurrence = ja_existentes + i
    se ja_existentes >= ocorrencias_no_arquivo:
        match_status = 'ignored'
        selected = false
        match_reason = { motivo: "já importada anteriormente" }

fitid já existente para o usuário  ->  'ignored', mesmo motivo
```

## Fluxo por formato

- **PDF (com IA, único ponto de IA)**: `pdfjs-dist` no cliente extrai o texto de cada página na ordem de leitura → envia para a edge function `parse-bank-statement-pdf` → Lovable AI (`https://ai.gateway.lovable.dev/v1/chat/completions`, `Authorization: Bearer ${LOVABLE_API_KEY}`, modelo `google/gemini-2.5-flash`) com **tool calling** e JSON schema estrito devolvendo `date` (ISO), `description`, `amount` (positivo) e `direction`. Instrução explícita: extrair só linhas de lançamento, ignorar cabeçalho, rodapé, saldo, subtotal e texto institucional, não inventar linha, não alterar valor. Mais de 6 páginas → lotes de 4 páginas com junção dos resultados. Erros 429 (limite) e 402 (créditos) viram mensagem clara na tela sem quebrar o fluxo. PDF não passa pela tela de mapeamento.
- **Trava de confiança (segunda chamada)**: o modelo extrai saldo inicial e final quando existirem. Valida `saldo_inicial + créditos − débitos = saldo_final`. Se não fechar, alerta amarelo no topo da conferência com o valor da divergência. Não bloqueia a importação.
- **CSV / XLSX**: parsing determinístico + tela de mapeamento de colunas (data, descrição, valor, e sinal ou coluna débito/crédito).
- **OFX**: parser próprio das tags `STMTTRN` lendo `DTPOSTED`, `TRNAMT`, `MEMO`, `NAME`, `FITID`.
- Limites: 2000 linhas por arquivo, 30 páginas por PDF, com mensagem clara ao estourar.

## Categoria sugerida

Ordem: regra do usuário em `moneyzap_merchant_rules` → dicionário estático `src/utils/statement/defaultMerchants.ts` (~100 estabelecimentos brasileiros, incluindo regionais do Sul: Zaffari, Panvel, Farmácias São João, Havan, Renner, Shell, Ipiranga, iFood, Uber, 99, Rappi, Mercado Livre) → vazio. Sem migração para o dicionário. Toda categorização manual faz upsert da regra do usuário.

## Arquivos

Novos:
- `supabase/functions/parse-bank-statement-pdf/index.ts`
- `src/types/statements.ts`
- `src/utils/statement/normalizeMerchant.ts`, `hashLine.ts`, `parseCsv.ts`, `parseXlsx.ts`, `parseOfx.ts`, `parsePdf.ts`, `defaultMerchants.ts`
- `src/services/statementImportService.ts`, `src/services/reconciliationService.ts`, `src/services/merchantRuleService.ts`
- `src/hooks/useStatementImport.ts`
- `src/pages/StatementImportPage.tsx`
- `src/components/statements/UploadStep.tsx`, `ColumnMappingStep.tsx`, `ReviewTable.tsx`, `ReviewRow.tsx`, `ReconcileDialog.tsx`, `BalanceWarning.tsx`, `ImportSummaryBar.tsx`

Alterados (mínimo):
- `src/App.tsx` — rota protegida `/importar-extrato`
- `src/components/layout/Sidebar.tsx` e `src/components/layout/MobileNavBar.tsx` — item de menu
- `src/types/index.ts` — campos opcionais de conciliação em `Transaction`
- `src/contexts/AppContext.tsx` — um único refetch ao final da confirmação
- `package.json` — `pdfjs-dist` e `xlsx`

Nenhuma outra tela existente é tocada. Sem fechamento de mês, sem mexer no agente de WhatsApp.

## Tela de conferência

Cabeçalho: arquivo, formato, período, toggle PF/PJ do lote, contadores (total / novas / possíveis duplicatas / ignoradas / selecionadas) e, quando houver, o alerta amarelo de divergência de saldo.

Filtros: todas | novas | possíveis duplicatas | sem categoria | ignoradas; busca por descrição.

Colunas por linha: checkbox de importar · data (editável) · descrição do banco (somente leitura, com `merchant_key` em legenda) · valor (editável) · direção (chip trocável) · categoria (chips filtrados por tipo + entidade, com selo "sugerido") · entidade (toggle por linha) · status (Nova / Possível duplicata / Conciliada / Ignorada) · ações (Conciliar, Importar como nova, Ignorar).

Diálogo de conciliação: extrato × lançamento existente lado a lado, diferença em R$, % e dias; botão "Conciliar" oculto quando o candidato tem meta.

Rodapé fixo: "X de Y selecionadas", resumo do que será criado e conciliado, confirmação antes de gravar.

## Algoritmo de conciliação

```text
candidatos = transações do usuário onde
    type = L.direction
    e date entre L.posted_at - 3 e L.posted_at + 3
    e reconciled_at IS NULL
    e user_id IS NOT NULL
    e não vinculada a outra linha deste import

para cada C:
    difValor = abs(C.amount - L.amount)
    difPct   = difValor / max(C.amount, 0.01)
    se difValor <= 5.00 ou difPct <= 0.03:
        score = 0.6*(1 - min(difValor/5,1)) + 0.3*(1 - difDias/3) + 0.1*similaridade(descrições)

se houver candidato: match_status='possible_duplicate', guarda melhor score e match_reason, selected=false
senão: match_status='new'

categoria = regra do usuário  ->  dicionário estático  ->  vazio
```

Na confirmação:
```text
importar como nova  -> insert em moneyzap_transactions (type, amount, date, description,
                       category_id, entidade, user_id, statement_line_id, import_id)
conciliar           -> update do registro existente:
                       original_amount/original_description = valores atuais (só se reconciled_at IS NULL)
                       amount, date, description = dado do banco
                       reconciled_at = now(), statement_line_id = L.id
categoria alterada  -> upsert em moneyzap_merchant_rules, hit_count + 1
ao final            -> um único refetch do AppContext
```

## Riscos

- Migração bloqueada por preferência de aprovação: preciso que a permissão de migrações seja liberada em Cloud → permissões do agente.
- Regenerar `src/integrations/supabase/types.ts` pode expor erros de tipo latentes em telas antigas.
- Conciliação sobrescreve dado digitado pelo usuário — mitigado por `original_amount`/`original_description` e confirmação manual.
- Extração de PDF por IA pode errar linhas; mitigada pela conferência obrigatória e pela trava de saldo.
- Assimetria `entidade`/`entidades` é fonte recorrente de bug e será respeitada em todos os filtros novos.
