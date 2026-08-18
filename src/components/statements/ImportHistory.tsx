import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatementImport } from "@/types/statements";

interface ImportHistoryProps {
  imports: StatementImport[];
  onUndo: (importRecord: StatementImport) => Promise<void>;
  onOpen: (importRecord: StatementImport) => void;
}

const ImportHistory: React.FC<ImportHistoryProps> = ({
  imports,
  onUndo,
  onOpen,
}) => {
  const [target, setTarget] = useState<StatementImport | null>(null);
  const [busy, setBusy] = useState(false);

  if (imports.length === 0) return null;

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Importações anteriores</h2>
      <div className="mt-3 space-y-2">
        {imports.map((imp) => (
          <div
            key={imp.id}
            className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{imp.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(imp.created_at).toLocaleString("pt-BR")} ·{" "}
                {imp.imported_rows} criadas · {imp.reconciled_rows} conciliadas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={imp.status === "completed" ? "default" : "outline"}>
                {imp.status === "completed"
                  ? "Concluída"
                  : imp.status === "discarded"
                  ? "Desfeita"
                  : "Em conferência"}
              </Badge>
              {imp.status !== "completed" && (
                <Button size="sm" variant="outline" onClick={() => onOpen(imp)}>
                  Retomar
                </Button>
              )}
              {imp.status === "completed" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setTarget(imp)}
                >
                  Desfazer
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desfazer esta importação?</AlertDialogTitle>
            <AlertDialogDescription>
              Serão apagadas as {target?.imported_rows ?? 0} transações criadas
              por este arquivo e revertidas as {target?.reconciled_rows ?? 0}{" "}
              conciliações, restaurando valor e descrição originais. Lançamentos
              que você editou manualmente depois também voltam ao estado
              original.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={async (e) => {
                e.preventDefault();
                if (!target) return;
                setBusy(true);
                await onUndo(target);
                setBusy(false);
                setTarget(null);
              }}
            >
              Desfazer importação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ImportHistory;
