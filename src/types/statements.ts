export type StatementFormat = "csv" | "xlsx" | "ofx" | "pdf";

export type MatchStatus =
  | "new"
  | "possible_duplicate"
  | "reconciled"
  | "imported"
  | "ignored";

export type ImportStatus = "pending" | "reviewing" | "completed" | "discarded";

/** Lançamento cru saído de qualquer parser, antes do enriquecimento */
export interface RawStatementEntry {
  postedAt: string; // YYYY-MM-DD
  description: string;
  amount: number; // sempre positivo
  direction: "income" | "expense";
  fitid?: string | null;
  raw: Record<string, unknown>;
}

export interface ParseResult {
  entries: RawStatementEntry[];
  openingBalance?: number | null;
  closingBalance?: number | null;
  balanceDiff?: number | null;
}

export interface StatementImport {
  id: string;
  user_id: string;
  upload_id: string | null;
  file_name: string;
  file_hash: string;
  file_format: StatementFormat;
  entidade_default: number;
  status: ImportStatus;
  period_start: string | null;
  period_end: string | null;
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  reconciled_rows: number;
  opening_balance: number | null;
  closing_balance: number | null;
  balance_check_diff: number | null;
  created_at: string;
  updated_at: string;
}

export interface StatementLine {
  id: string;
  import_id: string;
  user_id: string;
  row_index: number;
  raw_line: Record<string, unknown>;
  line_hash: string;
  occurrence: number;
  fitid: string | null;
  posted_at: string;
  description_raw: string;
  merchant_key: string;
  amount: number;
  direction: "income" | "expense";
  entidade: number;
  suggested_category_id: string | null;
  category_id: string | null;
  match_status: MatchStatus;
  match_transaction_id: string | null;
  match_score: number | null;
  match_reason: MatchReason | null;
  selected: boolean;
  created_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchReason {
  motivo?: string;
  diffValor?: number;
  diffPct?: number;
  diffDias?: number;
  candidato?: {
    id: string;
    date: string;
    amount: number;
    description: string;
    hasGoal: boolean;
  };
}

export interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  /** coluna opcional que indica débito/crédito quando o valor não tem sinal */
  directionColumn?: string | null;
  /** quando não há coluna de direção: valor negativo = despesa */
  negativeIsExpense: boolean;
  dateFormat: "auto" | "dd/mm/yyyy" | "yyyy-mm-dd" | "mm/dd/yyyy";
}

export const MAX_LINES_PER_FILE = 2000;
export const MAX_PDF_PAGES = 30;
