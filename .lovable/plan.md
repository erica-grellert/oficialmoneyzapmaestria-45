# Importação de Extrato Bancário com Conferência e Conciliação (Fase 1)

## Resposta direta: nome real da coluna de entidade

Em `moneyzap_transactions` a coluna é **`entidade`** — singular, tipo `smallint` (`int2`), `NOT NULL`, default `1` (1 = Pessoal, 2 = Empresarial).

Atenção à assimetria confirmada no banco: em `moneyzap_categories` a coluna é **`entidades`** — plural, tipo `smallint[]` (`_int2`), `NOT NULL`, default `'{1}'`. Não são a mesma coisa e o código já trata as duas de formas diferentes (`.eq('entidade', n)` para transações, `.contains('entidades', [n])` para categorias).

## Schema atual relevante (literal, lido do banco agora)

```text
moneyzap_transactions
  id           uuid        NOT NULL  default gen_random_uuid()
  user_id      uuid        NULL
  type         text        NOT NULL              -- 'income' | 'expense'
  amount       numeric     NOT NULL
  category_id  uuid        NULL      -> moneyzap_categories.id
  description  text        NULL
  date         date        NOT NULL
  goal_id      uuid        NULL      -> moneyzap_goals.id
  created_at   timestamptz NULL      default now()
  updated_at   timestamptz NULL      default now()
  entidade     smallint    NOT NULL  default 1

moneyzap_categories
  id          uuid        NOT NULL default gen_random_uuid()
  user_id     uuid        NULL
  name        text        NOT NULL
  type        text        NOT NULL
  color       text        NOT NULL default '#9E9E9E'
  icon        text        NULL     default 'circle'
  is_default  boolean     NULL     default false
  created_at  timestamptz NULL     default now()
  entidades   smallint[]  NOT NULL default '{1}'

moneyzap_uploads
  id          uuid        NOT NULL default gen_random_uuid()
  user_id     uuid        NULL     -> moneyzap_users.id
  file_name   text        NOT NULL
  file_path   text        NOT NULL
  file_size   integer     NULL
  mime_type   text        NULL
  purpose     text        NULL
  created_at  timestamptz NULL     default now()
```

Funções que serão reaproveitadas sem alteração: `register_upload(...)`, `generate_upload_path(user_id, ext)`, `validate_file_type(file_name, allowed[])`. Bucket `uploads` (público) já existe — não será recriado. RLS de `moneyzap_uploads` já cobre "Users can manage own uploads".

Também confirmado: `src/integrations/supabase/types.ts` já reflete `entidade: number` em transactions e `entidades: number[]` em categories. Nenhuma edge function de importação existe hoje (as 24 atuais são Stripe, admin, settings, referral).

## Tabelas novas propostas

### 1. `moneyzap_bank_accounts`
Origem do padrão de entidade por conta.

| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| user_id | uuid NOT NULL | referencia auth.users (sem FK, por regra do projeto) |
| name | text NOT NULL | "Nubank PJ" |
| bank_code | text NULL | |
| account_hint | text NULL | últimos dígitos |
| entidade_default | smallint NOT NULL default 1 | 1 PF / 2 PJ |
| is_active | boolean NOT NULL default true |
| created_at / updated_at | timestamptz default now() |

Índice: `(user_id, is_active)`.

### 2. `moneyzap_statement_imports`
Um registro por arquivo enviado. É o que garante a não duplicação de arquivo.

| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| upload_id | uuid NULL | FK -> moneyzap_uploads(id) ON DELETE SET NULL |
| bank_account_id | uuid NULL | FK -> moneyzap_bank_accounts(id) ON DELETE SET NULL |
| file_name | text NOT NULL | |
| file_hash | text NOT NULL | SHA-256 do conteúdo bruto |
| file_format | text NOT NULL | 'csv' \| 'ofx' \| 'xlsx' |
| entidade_default | smallint NOT NULL default 1 | |
| status | text NOT NULL default 'pending' | pending / reviewing / completed / discarded |
| period_start / period_end | date NULL | |
| total_rows, imported_rows, skipped_rows, reconciled_rows | integer NOT NULL default 0 |
| created_at / updated_at | timestamptz default now() |

Índices: `UNIQUE (user_id, file_hash)` — reenvio do mesmo arquivo é detectado; `(user_id, created_at desc)`.

### 3. `moneyzap_statement_lines` (staging)
Nada aqui é transação. É a área de conferência.

| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| import_id | uuid NOT NULL | FK -> moneyzap_statement_imports(id) ON DELETE CASCADE |
| user_id | uuid NOT NULL | |
| row_index | integer NOT NULL | ordem no arquivo |
| raw_line | jsonb NOT NULL | linha original íntegra |
| line_hash | text NOT NULL | hash de data+valor+descrição+fitid |
| fitid | text NULL | id do OFX quando existir |
| posted_at | date NOT NULL | |
| description_raw | text NOT NULL | |
| merchant_key | text NOT NULL | descrição normalizada (upper, sem acento/números/ruído) |
| amount | numeric NOT NULL | sempre positivo |
| direction | text NOT NULL | 'income' \| 'expense' |
| entidade | smallint NOT NULL default 1 | herdada da conta, editável por linha |
| suggested_category_id | uuid NULL | FK -> moneyzap_categories(id) ON DELETE SET NULL |
| category_id | uuid NULL | escolha do usuário |
| match_status | text NOT NULL default 'new' | new / possible_duplicate / reconciled / imported / ignored |
| match_transaction_id | uuid NULL | FK -> moneyzap_transactions(id) ON DELETE SET NULL |
| match_score | numeric NULL | |
| match_reason | jsonb NULL | diffs de valor/data que geraram a suspeita |
| selected | boolean NOT NULL default false | marcação do usuário |
| created_transaction_id | uuid NULL | FK -> moneyzap_transactions(id) ON DELETE SET NULL |
| created_at / updated_at | timestamptz default now() |

Índices: `UNIQUE (import_id, line_hash)`, `(user_id, posted_at)`, `(import_id, match_status)`.

### 4. `moneyzap_merchant_rules` (de-para que aprende por usuário)

| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| merchant_key | text NOT NULL | chave normalizada |
| category_id | uuid NOT NULL | FK -> moneyzap_categories(id) ON DELETE CASCADE |
| entidade | smallint NOT NULL default 1 | regra é por entidade |
| direction | text NOT NULL | 'income' \| 'expense' |
| hit_count | integer NOT NULL default 1 | |
| last_used_at | timestamptz default now() |
| created_at / updated_at | timestamptz default now() |

Índice: `UNIQUE (user_id, merchant_key, entidade, direction)`; `(user_id, merchant_key)`.

### 5. Alterações em tabela existente
`moneyzap_transactions` recebe três colunas nullable (nenhuma quebra de código existente):
`reconciled_at timestamptz NULL`, `statement_line_id uuid NULL`, `import_id uuid NULL`.
Nada é removido, nada muda de default.

### RLS (todas as tabelas novas)
Padrão idêntico ao já usado no projeto — dono só vê o que é dele:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<tabela> TO authenticated;
GRANT ALL ON public.<tabela> TO service_role;
ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.<tabela> FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- insert/update/delete idem com WITH CHECK (auth.uid() = user_id)
```
Sem grant para `anon` em nenhuma delas. `moneyzap_statement_lines` também valida que o `import_id` pertence ao usuário.

## Arquivos e componentes

Novos:
- `src/types/statements.ts` — tipos de import, linha, regra, resultado de match.
- `src/utils/statement/parseCsv.ts`, `parseOfx.ts`, `parseXlsx.ts`, `normalizeMerchant.ts`, `hashFile.ts` — parsing determinístico, zero IA.
- `src/services/statementImportService.ts` — upload (via `register_upload`), criação do import, checagem de `file_hash`, leitura/gravação das linhas.
- `src/services/reconciliationService.ts` — busca de candidatos e cálculo de match.
- `src/services/merchantRuleService.ts` — leitura/gravação do de-para.
- `src/pages/StatementImportPage.tsx` — rota `/importar-extrato`.
- `src/components/statements/UploadStep.tsx`, `ReviewTable.tsx`, `ReviewRow.tsx`, `DuplicateBadge.tsx`, `ReconcileDialog.tsx`, `ImportSummaryBar.tsx`, `BankAccountSelect.tsx`.
- `src/hooks/useStatementImport.ts`.

Alterados:
- `src/App.tsx` — nova rota protegida.
- `src/components/layout/Sidebar.tsx` e `MobileNavBar.tsx` — item de menu.
- `src/types/index.ts` — campos opcionais `reconciled_at`, `statement_line_id` em `Transaction`.
- `src/contexts/AppContext.tsx` — recarregar transações após confirmação da importação.
- `src/integrations/supabase/types.ts` — regenerado automaticamente pela migração.
- `package.json` — `xlsx` para XLSX (CSV e OFX com parser próprio).

Nada de edge function nova na fase 1: parsing no cliente e escrita via cliente Supabase com RLS. Se algum arquivo grande justificar, movemos para edge function na fase 2 junto com PDF.

## Tela de conferência, campo por campo

Cabeçalho: nome do arquivo, formato, período detectado, conta bancária (select, define entidade padrão), toggle de entidade padrão do lote, contadores (total / novas / possíveis duplicatas / selecionadas).

Barra de filtros: todas | só novas | só possíveis duplicatas | sem categoria; busca por descrição.

Tabela, uma linha por lançamento do extrato:
1. checkbox "importar" (marcado só pelo usuário; possíveis duplicatas começam desmarcadas)
2. data — editável (date picker), mostra a data original do arquivo em tooltip
3. descrição do banco — texto original, somente leitura, com o `merchant_key` em legenda
4. valor — editável, formatado em BRL, cor por direção
5. direção — chip Receita/Despesa, trocável
6. categoria — `CategoryChips`/select já existentes, filtrados por tipo + entidade da linha; se veio de regra aprendida, exibe selo "sugerido"
7. entidade — toggle PF/PJ por linha, default herdado da conta
8. status — chip: Nova | Possível duplicata | Conciliada | Ignorada
9. ações — "Conciliar com existente" (abre diálogo), "Importar como nova", "Ignorar"

Diálogo de conciliação: lado a lado a linha do extrato e o lançamento existente (data, valor, descrição, categoria, entidade), diferença de valor em R$ e %, diferença em dias, e dois botões: "Conciliar (atualiza o existente com o dado do banco)" e "Importar como registro novo".

Rodapé fixo: "X de Y selecionadas — importar", com resumo do que será criado e do que será conciliado, e confirmação antes de gravar.

## Algoritmo de conciliação (pseudocódigo)

```text
para cada linha L do arquivo:
  candidatos = transações do usuário onde
      user_id = L.user_id
      e type = L.direction
      e date entre L.posted_at - 3 dias e L.posted_at + 3 dias
      e não vinculada a outra linha deste import

  melhores = []
  para cada C em candidatos:
      difValor = abs(C.amount - L.amount)
      difPct   = difValor / max(C.amount, 0.01)
      if difValor <= 5.00 ou difPct <= 0.03:
          difDias = abs(dias(C.date, L.posted_at))
          score = 0.6 * (1 - min(difValor / 5.00, 1))
                + 0.3 * (1 - difDias / 3)
                + 0.1 * similaridade(C.description, L.description_raw)
          melhores.push({C, score, difValor, difPct, difDias})

  se melhores não vazio:
      L.match_status = 'possible_duplicate'
      L.match_transaction_id = melhores[maior score].C.id
      L.match_score / L.match_reason = detalhes
      L.selected = false            -- nunca decide sozinho
  senão:
      L.match_status = 'new'

  -- categoria por de-para aprendido
  regra = merchant_rules[user_id, L.merchant_key, L.entidade, L.direction]
  se regra: L.suggested_category_id = regra.category_id
```

Confirmação do usuário:
```text
para cada linha selecionada:
  se ação = 'importar como nova':
      insert em moneyzap_transactions (type, amount, date, description,
          category_id, entidade, user_id, statement_line_id, import_id)
  se ação = 'conciliar':
      update moneyzap_transactions do match:
          amount = L.amount, date = L.posted_at,
          description = L.description_raw,
          reconciled_at = now(), statement_line_id = L.id
      -- o registro original é mantido, nunca recriado
  se o usuário trocou a categoria manualmente:
      upsert merchant_rules(user_id, merchant_key, entidade, direction, category_id)
      hit_count = hit_count + 1
```

Reenvio do mesmo arquivo: antes do parse, calcula SHA-256; se já existe `(user_id, file_hash)`, abre o import anterior em vez de criar outro. Dentro de um import, `UNIQUE (import_id, line_hash)` impede linha repetida.

## O que preciso de você antes de começar

1. Contas bancárias: crio a tabela `moneyzap_bank_accounts` com uma tela simples de cadastro, ou na fase 1 basta escolher a entidade padrão no momento do upload (sem cadastro de conta)?
2. Layout de CSV: seus bancos exportam em formatos diferentes. Faço um mapeador manual de colunas na tela de upload (você aponta qual coluna é data, valor, descrição) ou fixo os layouts de bancos específicos? Quais bancos?
3. Sinal do valor: em CSV/XLSX a direção vem do sinal do valor (negativo = despesa) ou de uma coluna separada tipo débito/crédito?
4. Conciliação com lançamento já conciliado antes: pode reconciliar de novo ou fica bloqueado?

## Riscos e o que pode quebrar

- `moneyzap_transactions.user_id` é nullable e o RLS depende dele; a importação sempre preencherá, mas dados antigos sem `user_id` não aparecem como candidatos de conciliação.
- `AppContext.tsx` já é grande e concentra transações e categorias; a importação em lote pode gerar refetch pesado. Mitigação: um único refetch ao final da confirmação, não por linha.
- Regeneração de `src/integrations/supabase/types.ts` após a migração pode expor erros de tipo latentes em telas antigas.
- Ao conciliar, sobrescrevemos valor/data/descrição de um lançamento existente — é destrutivo sobre o dado que o usuário digitou. Mitigação: diálogo mostra o antes e depois e a ação nunca é automática.
- Se a transação conciliada estiver vinculada a uma meta (`goal_id`), mudar o valor exige acertar o saldo da meta via `update_goal_amount` com a diferença — ponto de atenção na implementação.
- Assimetria `entidade` (escalar) vs `entidades` (array) é fonte recorrente de bug; o filtro de categorias na tela de conferência precisa usar `contains`.
- Parsing no cliente: arquivos muito grandes (milhares de linhas) podem travar a UI. Mitigação: limite de linhas na fase 1 e processamento em lotes.
