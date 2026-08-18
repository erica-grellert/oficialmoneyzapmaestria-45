import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ColumnMapping } from "@/types/statements";
import { TabularPreview } from "@/utils/statement/parseTabular";

interface ColumnMappingStepProps {
  preview: TabularPreview;
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
  loading: boolean;
}

const NONE = "__none__";

const guess = (headers: string[], patterns: string[]): string =>
  headers.find((h) =>
    patterns.some((p) => h.toLowerCase().includes(p))
  ) || headers[0] || "";

const ColumnMappingStep: React.FC<ColumnMappingStepProps> = ({
  preview,
  onConfirm,
  onCancel,
  loading,
}) => {
  const headers = preview.headers;

  const [dateCol, setDateCol] = useState(() =>
    guess(headers, ["data", "date", "dt"])
  );
  const [descCol, setDescCol] = useState(() =>
    guess(headers, ["desc", "hist", "lanç", "lanc", "memo", "detalhe"])
  );
  const [amountCol, setAmountCol] = useState(() =>
    guess(headers, ["valor", "amount", "montante", "credito", "débito"])
  );
  const [directionCol, setDirectionCol] = useState<string>(NONE);
  const [negativeIsExpense, setNegativeIsExpense] = useState(true);
  const [dateFormat, setDateFormat] =
    useState<ColumnMapping["dateFormat"]>("auto");

  const sample = useMemo(() => preview.rows.slice(0, 5), [preview.rows]);

  const renderSelect = (
    value: string,
    setValue: (v: string) => void,
    withNone = false
  ) => (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione a coluna" />
      </SelectTrigger>
      <SelectContent>
        {withNone && <SelectItem value={NONE}>Não tenho essa coluna</SelectItem>}
        {headers.map((h) => (
          <SelectItem key={h} value={h}>
            {h}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Card className="space-y-5 p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">Mapear colunas</h2>
        <p className="text-sm text-muted-foreground">
          Indique quais colunas do arquivo correspondem a cada campo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Data</Label>
          {renderSelect(dateCol, setDateCol)}
        </div>
        <div className="space-y-1.5">
          <Label>Descrição</Label>
          {renderSelect(descCol, setDescCol)}
        </div>
        <div className="space-y-1.5">
          <Label>Valor</Label>
          {renderSelect(amountCol, setAmountCol)}
        </div>
        <div className="space-y-1.5">
          <Label>Coluna de débito/crédito (opcional)</Label>
          {renderSelect(directionCol, setDirectionCol, true)}
        </div>
        <div className="space-y-1.5">
          <Label>Formato da data</Label>
          <Select
            value={dateFormat}
            onValueChange={(v) => setDateFormat(v as ColumnMapping["dateFormat"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Detectar automaticamente</SelectItem>
              <SelectItem value="dd/mm/yyyy">DD/MM/AAAA</SelectItem>
              <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
              <SelectItem value="mm/dd/yyyy">MM/DD/AAAA</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {directionCol === NONE && (
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Valor negativo é despesa</p>
              <p className="text-xs text-muted-foreground">
                Desligue se o seu banco usa o sinal invertido.
              </p>
            </div>
            <Switch
              checked={negativeIsExpense}
              onCheckedChange={setNegativeIsExpense}
            />
          </div>
        )}
      </div>

      {sample.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="whitespace-nowrap px-2 py-1.5 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sample.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  {headers.map((h) => (
                    <td key={h} className="whitespace-nowrap px-2 py-1.5">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          disabled={loading || !dateCol || !amountCol}
          onClick={() =>
            onConfirm({
              date: dateCol,
              description: descCol,
              amount: amountCol,
              directionColumn: directionCol === NONE ? null : directionCol,
              negativeIsExpense,
              dateFormat,
            })
          }
        >
          Continuar para a conferência
        </Button>
      </div>
    </Card>
  );
};

export default ColumnMappingStep;
