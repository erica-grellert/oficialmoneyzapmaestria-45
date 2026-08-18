import React, { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileUp, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatementFormat } from "@/types/statements";

interface UploadStepProps {
  entidade: 1 | 2;
  onEntidadeChange: (entidade: 1 | 2) => void;
  onFileSelected: (file: File, format: StatementFormat) => void;
  loading: boolean;
  loadingLabel?: string;
}

const detectFormat = (fileName: string): StatementFormat | null => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "csv" || ext === "txt") return "csv";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  if (ext === "ofx" || ext === "qfx") return "ofx";
  if (ext === "pdf") return "pdf";
  return null;
};

const UploadStep: React.FC<UploadStepProps> = ({
  entidade,
  onEntidadeChange,
  onFileSelected,
  loading,
  loadingLabel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const format = detectFormat(file.name);
    if (!format) {
      setError(
        "Formato não suportado. Envie um arquivo PDF, CSV, XLSX ou OFX."
      );
      return;
    }
    setError(null);
    onFileSelected(file, format);
  };

  return (
    <Card className="p-4 sm:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Enviar extrato</h2>
        <p className="text-sm text-muted-foreground">
          Formatos aceitos: PDF, CSV, XLSX e OFX. Nada é lançado na sua conta
          antes da conferência.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Entidade padrão deste arquivo</p>
        <div className="inline-flex items-center rounded-lg bg-muted p-0.5">
          <button
            type="button"
            onClick={() => onEntidadeChange(1)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              entidade === 1
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="h-4 w-4" /> Pessoal
          </button>
          <button
            type="button"
            onClick={() => onEntidadeChange(2)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              entidade === 2
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="h-4 w-4" /> Empresarial
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Você poderá trocar a entidade linha a linha na conferência.
        </p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!loading) handleFile(e.dataTransfer.files?.[0]);
        }}
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-center"
      >
        {loading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {loadingLabel || "Processando arquivo..."}
            </p>
          </>
        ) : (
          <>
            <FileUp className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arraste o arquivo aqui ou selecione no computador
            </p>
            <Button onClick={() => inputRef.current?.click()}>
              Selecionar arquivo
            </Button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.csv,.txt,.xlsx,.xls,.ofx,.qfx"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Limites: 2.000 lançamentos por arquivo e 30 páginas por PDF. A leitura
        de PDF usa IA e por isso a conferência é obrigatória.
      </p>
    </Card>
  );
};

export default UploadStep;
