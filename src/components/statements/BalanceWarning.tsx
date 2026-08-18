import React from "react";
import { AlertTriangle } from "lucide-react";

interface BalanceWarningProps {
  diff: number;
  openingBalance?: number | null;
  closingBalance?: number | null;
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );

const BalanceWarning: React.FC<BalanceWarningProps> = ({
  diff,
  openingBalance,
  closingBalance,
}) => (
  <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 sm:p-4">
    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
    <div className="text-sm text-amber-900">
      <p className="font-semibold">
        A soma dos lançamentos não fecha com os saldos do extrato
      </p>
      <p className="mt-1">
        Divergência de <strong>{formatBRL(Math.abs(diff))}</strong>
        {typeof openingBalance === "number" && typeof closingBalance === "number" && (
          <>
            {" "}
            (saldo inicial {formatBRL(openingBalance)} · saldo final{" "}
            {formatBRL(closingBalance)})
          </>
        )}
        . Confira as linhas abaixo antes de importar — pode haver lançamento
        faltando ou lido de forma incorreta. A importação segue liberada.
      </p>
    </div>
  </div>
);

export default BalanceWarning;
