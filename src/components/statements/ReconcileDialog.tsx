import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { StatementLine } from "@/types/statements";

interface ReconcileDialogProps {
  line: StatementLine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReconcile: (line: StatementLine) => void;
  onImportAsNew: (line: StatementLine) => void;
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const ReconcileDialog: React.FC<ReconcileDialogProps> = ({
  line,
  open,
  onOpenChange,
  onReconcile,
  onImportAsNew,
}) => {
  if (!line) return null;

  const candidate = line.match_reason?.candidato;
  const hasGoal = Boolean(candidate?.hasGoal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Possível duplicata</DialogTitle>
          <DialogDescription>
            Compare o lançamento do extrato com o que já existe na sua conta e
            escolha o que fazer. Nada é decidido automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Linha do extrato
            </p>
            <p className="mt-2 text-sm">{formatDate(line.posted_at)}</p>
            <p className="text-lg font-bold">{formatBRL(Number(line.amount))}</p>
            <p className="text-sm text-muted-foreground break-words">
              {line.description_raw}
            </p>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Lançamento existente
            </p>
            <p className="mt-2 text-sm">
              {candidate ? formatDate(candidate.date) : "—"}
            </p>
            <p className="text-lg font-bold">
              {candidate ? formatBRL(Number(candidate.amount)) : "—"}
            </p>
            <p className="text-sm text-muted-foreground break-words">
              {candidate?.description || "Sem descrição"}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-3 text-sm">
          Diferença de{" "}
          <strong>{formatBRL(Number(line.match_reason?.diffValor ?? 0))}</strong>{" "}
          ({line.match_reason?.diffPct ?? 0}%) e{" "}
          <strong>{line.match_reason?.diffDias ?? 0} dia(s)</strong>.
        </div>

        {hasGoal && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              Lançamento vinculado a uma meta, importe como novo ou ajuste
              manualmente.
            </span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onImportAsNew(line);
              onOpenChange(false);
            }}
          >
            Importar como registro novo
          </Button>
          {!hasGoal && (
            <Button
              onClick={() => {
                onReconcile(line);
                onOpenChange(false);
              }}
            >
              Conciliar com o existente
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReconcileDialog;
