import { supabase } from "@/integrations/supabase/client";
import {
  MAX_LINES_PER_FILE,
  ParseResult,
  RawStatementEntry,
  StatementFormat,
  StatementImport,
  StatementLine,
} from "@/types/statements";
import { buildLineHash, sha256File } from "@/utils/statement/hashLine";
import { normalizeMerchant } from "@/utils/statement/normalizeMerchant";
import {
  CategoryOption,
  MerchantRule,
  suggestCategoryId,
} from "./merchantRuleService";
import { fetchCandidates, findMatch } from "./reconciliationService";

const db = supabase as any;

export class StatementImportError extends Error {
  code?: string;
  importId?: string;
  constructor(message: string, code?: string, importId?: string) {
    super(message);
    this.code = code;
    this.importId = importId;
  }
}

export const getCurrentUserId = async (): Promise<string> => {
  const { data } = await supabase.auth.getUser();
  if (!data?.user) throw new StatementImportError("Faça login para importar extratos.");
  return data.user.id;
};

/* ------------------------------------------------------------------ */
/* Uploads / imports                                                    */
/* ------------------------------------------------------------------ */

export const listImports = async (): Promise<StatementImport[]> => {
  const userId = await getCurrentUserId();
  const { data, error } = await db
    .from("moneyzap_statement_imports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error listing statement imports:", error);
    return [];
  }
  return (data ?? []) as StatementImport[];
};

export const findImportByHash = async (
  userId: string,
  fileHash: string
): Promise<StatementImport | null> => {
  const { data } = await db
    .from("moneyzap_statement_imports")
    .select("*")
    .eq("user_id", userId)
    .eq("file_hash", fileHash)
    .maybeSingle();
  return (data as StatementImport) ?? null;
};

/** Reutiliza o storage e as funções já existentes (generate_upload_path / register_upload) */
const uploadStatementFile = async (
  file: File,
  userId: string
): Promise<string | null> => {
  try {
    const extension = (file.name.split(".").pop() || "dat").toLowerCase();

    const { data: allowed } = await db.rpc("validate_file_type", {
      file_name: file.name,
      allowed_extensions: ["csv", "xlsx", "xls", "ofx", "pdf"],
    });
    if (allowed === false) return null;

    const { data: path } = await db.rpc("generate_upload_path", {
      user_id: userId,
      file_extension: extension,
    });
    if (!path) return null;

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(path as string, file, { upsert: false });
    if (uploadError) {
      console.error("Storage upload failed:", uploadError);
      return null;
    }

    const { data: uploadId } = await db.rpc("register_upload", {
      p_file_name: file.name,
      p_file_path: path,
      p_file_size: file.size,
      p_mime_type: file.type || null,
      p_purpose: "bank_statement",
    });

    return (uploadId as string) ?? null;
  } catch (error) {
    console.error("Error uploading statement file:", error);
    return null;
  }
};

/* ------------------------------------------------------------------ */
/* Staging                                                              */
/* ------------------------------------------------------------------ */

interface PreparedLine {
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
  match_status: string;
  match_transaction_id: string | null;
  match_score: number | null;
  match_reason: Record<string, unknown> | null;
  selected: boolean;
  row_index: number;
  raw_line: Record<string, unknown>;
}

/**
 * Deduplicação por ocorrência.
 * - efetivadas: linhas do usuário com aquele line_hash que viraram lançamento
 *   (created_transaction_id preenchido) ou que foram conciliadas.
 * - a i-ésima ocorrência do hash no arquivo é 'ignored' quando i <= efetivadas.
 * - occurrence é sempre a próxima posição livre sobre TODAS as linhas
 *   existentes daquele (user_id, line_hash), inclusive as ignoradas.
 */
const loadHashStats = async (
  userId: string,
  hashes: string[]
): Promise<Map<string, { total: number; effective: number }>> => {
  const stats = new Map<string, { total: number; effective: number }>();
  const unique = Array.from(new Set(hashes));
  if (unique.length === 0) return stats;

  const chunkSize = 200;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { data, error } = await db
      .from("moneyzap_statement_lines")
      .select("line_hash, occurrence, created_transaction_id, match_status")
      .eq("user_id", userId)
      .in("line_hash", chunk);

    if (error) {
      console.error("Error loading hash stats:", error);
      continue;
    }

    (data ?? []).forEach((row: any) => {
      const current = stats.get(row.line_hash) ?? { total: 0, effective: 0 };
      // total = próxima posição livre: cobre todas as linhas existentes,
      // inclusive as ignoradas, para nunca colidir com o índice único.
      current.total = Math.max(current.total + 0, Number(row.occurrence) || 0);
      current.rows = (current.rows ?? 0) + 1;
      if (row.created_transaction_id || row.match_status === "reconciled") {
        current.effective += 1;
      }
      stats.set(row.line_hash, current);
    });

    stats.forEach((value) => {
      value.total = Math.max(value.total, value.rows ?? 0);
    });

  }

  return stats;
};

const loadExistingFitids = async (
  userId: string,
  fitids: string[]
): Promise<Set<string>> => {
  const found = new Set<string>();
  const unique = Array.from(new Set(fitids.filter(Boolean)));
  if (unique.length === 0) return found;

  const chunkSize = 200;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { data } = await db
      .from("moneyzap_statement_lines")
      .select("fitid")
      .eq("user_id", userId)
      .in("fitid", chunk);
    (data ?? []).forEach((r: any) => r.fitid && found.add(r.fitid));
  }
  return found;
};

export interface CreateImportParams {
  file: File;
  format: StatementFormat;
  entidade: 1 | 2;
  parseResult: ParseResult;
  categories: CategoryOption[];
  merchantRules: MerchantRule[];
}

export interface CreateImportResult {
  importRecord: StatementImport;
  lines: StatementLine[];
}

export const createImportWithLines = async (
  params: CreateImportParams
): Promise<CreateImportResult> => {
  const userId = await getCurrentUserId();
  const entries = params.parseResult.entries;

  if (entries.length === 0) {
    throw new StatementImportError(
      "Nenhum lançamento foi encontrado neste arquivo."
    );
  }
  if (entries.length > MAX_LINES_PER_FILE) {
    throw new StatementImportError(
      `O arquivo tem ${entries.length} lançamentos e o limite é de ${MAX_LINES_PER_FILE}. Divida o extrato em períodos menores.`,
      "too_many_lines"
    );
  }

  const fileHash = await sha256File(params.file);
  const existing = await findImportByHash(userId, fileHash);
  if (existing) {
    throw new StatementImportError(
      "Este mesmo arquivo já foi enviado antes. Abrindo a importação existente.",
      "duplicate_file",
      existing.id
    );
  }

  // ---- enriquecimento das linhas ----
  const enriched = await Promise.all(
    entries.map(async (entry: RawStatementEntry) => {
      const merchantKey = normalizeMerchant(entry.description);
      const lineHash = await buildLineHash({
        postedAt: entry.postedAt,
        amount: entry.amount,
        direction: entry.direction,
        merchantKey,
      });
      return { entry, merchantKey, lineHash };
    })
  );

  const hashStats = await loadHashStats(
    userId,
    enriched.map((e) => e.lineHash)
  );
  const existingFitids = await loadExistingFitids(
    userId,
    enriched.map((e) => e.entry.fitid ?? "").filter(Boolean)
  );

  const candidates = await fetchCandidates(userId, entries);
  const usedCandidateIds = new Set<string>();

  const seenInFile = new Map<string, number>();
  const occurrenceCursor = new Map<string, number>();
  const prepared: PreparedLine[] = [];

  enriched.forEach(({ entry, merchantKey, lineHash }, index) => {
    const stats = hashStats.get(lineHash) ?? { total: 0, effective: 0 };

    const indexInFile = (seenInFile.get(lineHash) ?? 0) + 1;
    seenInFile.set(lineHash, indexInFile);

    const nextFree = (occurrenceCursor.get(lineHash) ?? stats.total) + 1;
    occurrenceCursor.set(lineHash, nextFree);

    const fitid = entry.fitid || null;
    const alreadyImportedByHash = indexInFile <= stats.effective;
    const alreadyImportedByFitid = Boolean(fitid && existingFitids.has(fitid));

    const suggested = suggestCategoryId(
      merchantKey,
      entry.direction,
      params.entidade,
      params.merchantRules,
      params.categories
    );

    let matchStatus = "new";
    let matchTransactionId: string | null = null;
    let matchScore: number | null = null;
    let matchReason: Record<string, unknown> | null = null;
    let selected = false;

    if (alreadyImportedByHash || alreadyImportedByFitid) {
      matchStatus = "ignored";
      matchReason = { motivo: "já importada anteriormente" };
    } else {
      const match = findMatch(entry, candidates, usedCandidateIds);
      if (match) {
        usedCandidateIds.add(match.transactionId);
        matchStatus = "possible_duplicate";
        matchTransactionId = match.transactionId;
        matchScore = match.score;
        matchReason = match.reason as unknown as Record<string, unknown>;
        selected = false;
      } else {
        selected = true;
      }
    }

    prepared.push({
      line_hash: lineHash,
      occurrence: nextFree,
      fitid: alreadyImportedByFitid ? null : fitid,
      posted_at: entry.postedAt,
      description_raw: entry.description,
      merchant_key: merchantKey,
      amount: entry.amount,
      direction: entry.direction,
      entidade: params.entidade,
      suggested_category_id: suggested,
      category_id: suggested,
      match_status: matchStatus,
      match_transaction_id: matchTransactionId,
      match_score: matchScore,
      match_reason: matchReason,
      selected,
      row_index: index,
      raw_line: entry.raw,
    });
  });

  const dates = entries.map((e) => e.postedAt).sort();

  const { data: importRow, error: importError } = await db
    .from("moneyzap_statement_imports")
    .insert({
      user_id: userId,
      file_name: params.file.name,
      file_hash: fileHash,
      file_format: params.format,
      entidade_default: params.entidade,
      status: "reviewing",
      period_start: dates[0] ?? null,
      period_end: dates[dates.length - 1] ?? null,
      total_rows: prepared.length,
      skipped_rows: prepared.filter((l) => l.match_status === "ignored").length,
      opening_balance: params.parseResult.openingBalance ?? null,
      closing_balance: params.parseResult.closingBalance ?? null,
      balance_check_diff: params.parseResult.balanceDiff ?? null,
    })
    .select()
    .single();

  if (importError || !importRow) {
    throw new StatementImportError(
      importError?.message || "Não foi possível registrar a importação."
    );
  }

  // upload do arquivo é best-effort: não bloqueia a conferência
  const uploadId = await uploadStatementFile(params.file, userId);
  if (uploadId) {
    await db
      .from("moneyzap_statement_imports")
      .update({ upload_id: uploadId })
      .eq("id", importRow.id);
  }

  const payload = prepared.map((line) => ({
    ...line,
    import_id: importRow.id,
    user_id: userId,
  }));

  const inserted: StatementLine[] = [];
  for (let i = 0; i < payload.length; i += 200) {
    const chunk = payload.slice(i, i + 200);
    const { data, error } = await db
      .from("moneyzap_statement_lines")
      .insert(chunk)
      .select();
    if (error) {
      await db.from("moneyzap_statement_imports").delete().eq("id", importRow.id);
      throw new StatementImportError(
        error.message || "Falha ao gravar as linhas do extrato."
      );
    }
    inserted.push(...((data ?? []) as StatementLine[]));
  }

  return {
    importRecord: importRow as StatementImport,
    lines: inserted.sort((a, b) => a.row_index - b.row_index),
  };
};

export const getImport = async (
  importId: string
): Promise<StatementImport | null> => {
  const { data } = await db
    .from("moneyzap_statement_imports")
    .select("*")
    .eq("id", importId)
    .maybeSingle();
  return (data as StatementImport) ?? null;
};

export const getImportLines = async (
  importId: string
): Promise<StatementLine[]> => {
  const { data, error } = await db
    .from("moneyzap_statement_lines")
    .select("*")
    .eq("import_id", importId)
    .order("row_index", { ascending: true });

  if (error) {
    console.error("Error loading statement lines:", error);
    return [];
  }
  return (data ?? []) as StatementLine[];
};

export const updateStatementLine = async (
  lineId: string,
  patch: Partial<StatementLine>
): Promise<void> => {
  const { error } = await db
    .from("moneyzap_statement_lines")
    .update(patch)
    .eq("id", lineId);
  if (error) console.error("Error updating statement line:", error);
};

/* ------------------------------------------------------------------ */
/* Confirmação                                                          */
/* ------------------------------------------------------------------ */

export interface ConfirmResult {
  created: number;
  reconciled: number;
  failed: number;
}

export const confirmImport = async (
  importId: string,
  lines: StatementLine[]
): Promise<ConfirmResult> => {
  const userId = await getCurrentUserId();
  const result: ConfirmResult = { created: 0, reconciled: 0, failed: 0 };

  const selected = lines.filter(
    (l) => l.selected && l.match_status !== "ignored" && l.match_status !== "imported"
  );

  for (const line of selected) {
    try {
      if (line.match_status === "reconciled" && line.match_transaction_id) {
        const { data: current } = await db
          .from("moneyzap_transactions")
          .select("id, amount, description, reconciled_at, goal_id")
          .eq("id", line.match_transaction_id)
          .maybeSingle();

        if (!current || current.goal_id) {
          result.failed += 1;
          continue;
        }

        const patch: Record<string, unknown> = {
          amount: line.amount,
          date: line.posted_at,
          description: line.description_raw,
          reconciled_at: new Date().toISOString(),
          statement_line_id: line.id,
          import_id: importId,
        };

        // histórico só é gravado na primeira conciliação
        if (!current.reconciled_at) {
          patch.original_amount = current.amount;
          patch.original_description = current.description;
        }

        const { error } = await db
          .from("moneyzap_transactions")
          .update(patch)
          .eq("id", current.id);

        if (error) {
          result.failed += 1;
          continue;
        }

        await updateStatementLine(line.id, {
          match_status: "reconciled",
          created_transaction_id: current.id,
        } as Partial<StatementLine>);
        result.reconciled += 1;
      } else {
        const { data: created, error } = await db
          .from("moneyzap_transactions")
          .insert({
            user_id: userId,
            type: line.direction,
            amount: line.amount,
            date: line.posted_at,
            description: line.description_raw,
            category_id: line.category_id,
            entidade: line.entidade,
            statement_line_id: line.id,
            import_id: importId,
          })
          .select("id")
          .single();

        if (error || !created) {
          result.failed += 1;
          continue;
        }

        await updateStatementLine(line.id, {
          match_status: "imported",
          created_transaction_id: created.id,
        } as Partial<StatementLine>);
        result.created += 1;
      }
    } catch (error) {
      console.error("Error confirming statement line:", error);
      result.failed += 1;
    }
  }

  await db
    .from("moneyzap_statement_imports")
    .update({
      status: "completed",
      imported_rows: result.created,
      reconciled_rows: result.reconciled,
    })
    .eq("id", importId);

  return result;
};

/* ------------------------------------------------------------------ */
/* Desfazer importação                                                  */
/* ------------------------------------------------------------------ */

export interface UndoPreview {
  createdCount: number;
  reconciledCount: number;
}

export const previewUndoImport = async (
  importId: string
): Promise<UndoPreview> => {
  const lines = await getImportLines(importId);
  return {
    createdCount: lines.filter(
      (l) => l.match_status === "imported" && l.created_transaction_id
    ).length,
    reconciledCount: lines.filter(
      (l) => l.match_status === "reconciled" && l.created_transaction_id
    ).length,
  };
};

export const undoImport = async (importId: string): Promise<UndoPreview> => {
  const lines = await getImportLines(importId);
  const undone: UndoPreview = { createdCount: 0, reconciledCount: 0 };

  // 1. apaga as transações criadas por este import
  const createdIds = lines
    .filter((l) => l.match_status === "imported" && l.created_transaction_id)
    .map((l) => l.created_transaction_id as string);

  if (createdIds.length > 0) {
    const { error } = await db
      .from("moneyzap_transactions")
      .delete()
      .eq("import_id", importId)
      .in("id", createdIds);
    if (!error) undone.createdCount = createdIds.length;
  }

  // 2. reverte as conciliações restaurando valor e descrição originais
  const reconciled = lines.filter(
    (l) => l.match_status === "reconciled" && l.created_transaction_id
  );

  for (const line of reconciled) {
    const { data: tx } = await db
      .from("moneyzap_transactions")
      .select("id, original_amount, original_description")
      .eq("id", line.created_transaction_id)
      .eq("import_id", importId)
      .maybeSingle();

    if (!tx) continue;

    const patch: Record<string, unknown> = {
      reconciled_at: null,
      statement_line_id: null,
      import_id: null,
      original_amount: null,
      original_description: null,
    };
    if (tx.original_amount !== null && tx.original_amount !== undefined) {
      patch.amount = tx.original_amount;
    }
    if (tx.original_description !== null && tx.original_description !== undefined) {
      patch.description = tx.original_description;
    }

    const { error } = await db
      .from("moneyzap_transactions")
      .update(patch)
      .eq("id", tx.id);
    if (!error) undone.reconciledCount += 1;
  }

  // 3. as linhas voltam a não contar como efetivadas
  await db
    .from("moneyzap_statement_lines")
    .update({
      match_status: "ignored",
      created_transaction_id: null,
      selected: false,
      match_reason: { motivo: "importação desfeita" },
    })
    .eq("import_id", importId);

  await db
    .from("moneyzap_statement_imports")
    .update({
      status: "discarded",
      imported_rows: 0,
      reconciled_rows: 0,
    })
    .eq("id", importId);

  return undone;
};
