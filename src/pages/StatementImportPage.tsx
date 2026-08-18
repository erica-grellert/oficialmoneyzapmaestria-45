import React, { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import SubscriptionGuard from "@/components/subscription/SubscriptionGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { FileSpreadsheet, Loader2 } from "lucide-react";

import UploadStep from "@/components/statements/UploadStep";
import ColumnMappingStep from "@/components/statements/ColumnMappingStep";
import ReviewTable from "@/components/statements/ReviewTable";
import ReconcileDialog from "@/components/statements/ReconcileDialog";
import BalanceWarning from "@/components/statements/BalanceWarning";
import ImportHistory from "@/components/statements/ImportHistory";

import {
  ColumnMapping,
  ParseResult,
  StatementFormat,
  StatementImport,
  StatementLine,
} from "@/types/statements";
import {
  buildTabularResult,
  parseCsvPreview,
  parseXlsxPreview,
  TabularPreview,
} from "@/utils/statement/parseTabular";
import { parseOfx } from "@/utils/statement/parseOfx";
import { parsePdf, StatementPdfError } from "@/utils/statement/parsePdf";
import {
  confirmImport,
  createImportWithLines,
  getImport,
  getImportLines,
  listImports,
  StatementImportError,
  updateStatementLine,
  undoImport,
  getCurrentUserId,
} from "@/services/statementImportService";
import {
  CategoryOption,
  getMerchantRules,
  upsertMerchantRule,
} from "@/services/merchantRuleService";
import { getCategories } from "@/services/categoryService";

type Step = "upload" | "mapping" | "review";

const StatementImportPage: React.FC = () => {
  const { toast } = useToast();
  const { entidadeAtiva, getTransactions } = useAppContext() as any;

  const [step, setStep] = useState<Step>("upload");
  const [entidade, setEntidade] = useState<1 | 2>(
    (entidadeAtiva as 1 | 2) || 1
  );
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState<string>("");
  const [confirming, setConfirming] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<TabularPreview | null>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [imports, setImports] = useState<StatementImport[]>([]);
  const [importRecord, setImportRecord] = useState<StatementImport | null>(null);
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [reconcileLine, setReconcileLine] = useState<StatementLine | null>(null);

  /* ---------------------------------------------------------------- */

  const loadCategories = useCallback(async () => {
    const list = await getCategories();
    setCategories(
      list.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        entidades: c.entidades ?? [1],
      }))
    );
  }, []);

  const loadImports = useCallback(async () => {
    setImports(await listImports());
  }, []);

  useEffect(() => {
    loadCategories();
    loadImports();
  }, [loadCategories, loadImports]);

  /* ---------------------------------------------------------------- */

  const startImport = useCallback(
    async (parseResult: ParseResult, selectedFile: File, format: StatementFormat) => {
      setLoadingLabel("Conferindo duplicatas e sugerindo categorias...");
      const userId = await getCurrentUserId();
      const rules = await getMerchantRules(userId);

      const { importRecord: record, lines: createdLines } =
        await createImportWithLines({
          file: selectedFile,
          format,
          entidade,
          parseResult,
          categories,
          merchantRules: rules,
        });

      setImportRecord(record);
      setLines(createdLines);
      setStep("review");
      loadImports();
    },
    [categories, entidade, loadImports]
  );

  const handleFileSelected = useCallback(
    async (selectedFile: File, format: StatementFormat) => {
      setFile(selectedFile);
      setLoading(true);
      try {
        if (format === "csv") {
          setLoadingLabel("Lendo o arquivo...");
          const text = await selectedFile.text();
          setPreview(parseCsvPreview(text));
          setStep("mapping");
          return;
        }

        if (format === "xlsx") {
          setLoadingLabel("Lendo a planilha...");
          setPreview(await parseXlsxPreview(selectedFile));
          setStep("mapping");
          return;
        }

        if (format === "ofx") {
          setLoadingLabel("Lendo o arquivo OFX...");
          const text = await selectedFile.text();
          await startImport(parseOfx(text), selectedFile, format);
          return;
        }

        setLoadingLabel("Lendo o PDF com IA, isso pode levar alguns instantes...");
        const result = await parsePdf(selectedFile);
        await startImport(result, selectedFile, format);
      } catch (error: any) {
        if (error instanceof StatementImportError && error.importId) {
          toast({
            title: "Arquivo já enviado",
            description: error.message,
          });
          const existing = await getImport(error.importId);
          if (existing) {
            setImportRecord(existing);
            setLines(await getImportLines(error.importId));
            setStep("review");
          }
        } else {
          toast({
            title: "Não consegui ler o extrato",
            description:
              error instanceof StatementPdfError ||
              error instanceof StatementImportError
                ? error.message
                : error?.message || "Tente novamente com outro arquivo.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
        setLoadingLabel("");
      }
    },
    [startImport, toast]
  );

  const handleMappingConfirm = useCallback(
    async (mapping: ColumnMapping) => {
      if (!preview || !file) return;
      setLoading(true);
      try {
        const result = buildTabularResult(preview.rows, mapping);
        if (result.entries.length === 0) {
          toast({
            title: "Nenhum lançamento reconhecido",
            description:
              "Revise o mapeamento de colunas, principalmente data e valor.",
            variant: "destructive",
          });
          return;
        }
        await startImport(
          result,
          file,
          file.name.toLowerCase().endsWith(".csv") ||
            file.name.toLowerCase().endsWith(".txt")
            ? "csv"
            : "xlsx"
        );
      } catch (error: any) {
        toast({
          title: "Erro ao preparar a conferência",
          description: error?.message || "Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [preview, file, startImport, toast]
  );

  /* ---------------------------------------------------------------- */

  const patchLine = useCallback(
    (lineId: string, patch: Partial<StatementLine>) => {
      setLines((prev) =>
        prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l))
      );
      updateStatementLine(lineId, patch);
    },
    []
  );

  const toggleAll = useCallback((selected: boolean) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.match_status === "ignored" || l.match_status === "imported") {
          return l;
        }
        updateStatementLine(l.id, { selected });
        return { ...l, selected };
      })
    );
  }, []);

  const handleReconcile = useCallback(
    (line: StatementLine) => {
      patchLine(line.id, { match_status: "reconciled", selected: true });
    },
    [patchLine]
  );

  const handleImportAsNew = useCallback(
    (line: StatementLine) => {
      patchLine(line.id, {
        match_status: "new",
        match_transaction_id: null,
        selected: true,
      });
    },
    [patchLine]
  );

  /* ---------------------------------------------------------------- */

  const summary = useMemo(() => {
    const active = lines.filter(
      (l) => l.selected && l.match_status !== "ignored" && l.match_status !== "imported"
    );
    return {
      selected: active.length,
      missingCategory: active.filter(
        (l) => l.match_status !== "reconciled" && !l.category_id
      ).length,
      duplicates: lines.filter((l) => l.match_status === "possible_duplicate")
        .length,
      total: lines.length,
    };
  }, [lines]);

  const handleConfirm = useCallback(async () => {
    if (!importRecord) return;
    setConfirming(true);
    try {
      const result = await confirmImport(importRecord.id, lines);

      // aprende as regras de categorização a partir das escolhas do usuário
      const userId = await getCurrentUserId();
      await Promise.all(
        lines
          .filter(
            (l) =>
              l.selected &&
              l.category_id &&
              l.category_id !== l.suggested_category_id
          )
          .map((l) =>
            upsertMerchantRule({
              userId,
              merchantKey: l.merchant_key,
              categoryId: l.category_id as string,
              entidade: l.entidade,
              direction: l.direction,
            })
          )
      );

      toast({
        title: "Importação concluída",
        description: `${result.created} lançamentos criados, ${result.reconciled} conciliados${
          result.failed ? `, ${result.failed} com erro` : ""
        }.`,
      });

      await getTransactions();
      await loadImports();
      setStep("upload");
      setFile(null);
      setPreview(null);
      setLines([]);
      setImportRecord(null);
    } catch (error: any) {
      toast({
        title: "Não consegui concluir a importação",
        description: error?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  }, [importRecord, lines, toast, getTransactions, loadImports]);

  const handleUndo = useCallback(
    async (record: StatementImport) => {
      try {
        const undone = await undoImport(record.id);
        toast({
          title: "Importação desfeita",
          description: `${undone.createdCount} transações apagadas e ${undone.reconciledCount} conciliações revertidas.`,
        });
        await getTransactions();
        await loadImports();
      } catch (error: any) {
        toast({
          title: "Não consegui desfazer",
          description: error?.message || "Tente novamente.",
          variant: "destructive",
        });
      }
    },
    [toast, getTransactions, loadImports]
  );

  const handleOpenImport = useCallback(async (record: StatementImport) => {
    setImportRecord(record);
    setLines(await getImportLines(record.id));
    setStep("review");
  }, []);

  /* ---------------------------------------------------------------- */

  return (
    <AppLayout>
      <SubscriptionGuard>
        <div className="mx-auto w-full max-w-6xl space-y-5 p-3 sm:p-6">
          <header className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">
                Importar extrato bancário
              </h1>
              <p className="text-sm text-muted-foreground">
                Envie o extrato, confira linha a linha e só então grave na sua
                conta.
              </p>
            </div>
          </header>

          {step === "upload" && (
            <>
              <UploadStep
                entidade={entidade}
                onEntidadeChange={setEntidade}
                onFileSelected={handleFileSelected}
                loading={loading}
                loadingLabel={loadingLabel}
              />
              <ImportHistory
                imports={imports}
                onUndo={handleUndo}
                onOpen={handleOpenImport}
              />
            </>
          )}

          {step === "mapping" && preview && (
            <ColumnMappingStep
              preview={preview}
              loading={loading}
              onCancel={() => {
                setStep("upload");
                setPreview(null);
                setFile(null);
              }}
              onConfirm={handleMappingConfirm}
            />
          )}

          {step === "review" && importRecord && (
            <>
              {typeof importRecord.balance_check_diff === "number" &&
                Math.abs(importRecord.balance_check_diff) > 0.01 && (
                  <BalanceWarning
                    diff={importRecord.balance_check_diff}
                    openingBalance={importRecord.opening_balance}
                    closingBalance={importRecord.closing_balance}
                  />
                )}

              <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="text-sm">
                  <p className="font-medium">{importRecord.file_name}</p>
                  <p className="text-muted-foreground">
                    {summary.total} linhas · {summary.selected} selecionadas ·{" "}
                    {summary.duplicates} possíveis duplicatas
                    {summary.missingCategory > 0 &&
                      ` · ${summary.missingCategory} sem categoria`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep("upload");
                      setLines([]);
                      setImportRecord(null);
                    }}
                  >
                    Voltar
                  </Button>
                  <Button
                    disabled={
                      confirming ||
                      summary.selected === 0 ||
                      summary.missingCategory > 0
                    }
                    onClick={handleConfirm}
                  >
                    {confirming && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Importar {summary.selected} lançamentos
                  </Button>
                </div>
              </Card>

              <ReviewTable
                lines={lines}
                categories={categories}
                onPatchLine={patchLine}
                onToggleAll={toggleAll}
                onOpenReconcile={(line) => setReconcileLine(line)}
              />
            </>
          )}

          <ReconcileDialog
            line={reconcileLine}
            open={Boolean(reconcileLine)}
            onOpenChange={(open) => !open && setReconcileLine(null)}
            onReconcile={handleReconcile}
            onImportAsNew={handleImportAsNew}
          />
        </div>
      </SubscriptionGuard>
    </AppLayout>
  );
};

export default StatementImportPage;
