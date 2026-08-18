import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Search } from "lucide-react";
import { StatementLine } from "@/types/statements";
import { CategoryOption } from "@/services/merchantRuleService";
import { cn } from "@/lib/utils";

interface ReviewTableProps {
  lines: StatementLine[];
  categories: CategoryOption[];
  onPatchLine: (lineId: string, patch: Partial<StatementLine>) => void;
  onToggleAll: (selected: boolean) => void;
  onOpenReconcile: (line: StatementLine) => void;
}

type FilterKey = "all" | "new" | "possible_duplicate" | "no_category" | "ignored";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );

const formatDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const statusBadge = (line: StatementLine) => {
  switch (line.match_status) {
    case "possible_duplicate":
      return <Badge variant="secondary">Possível duplicata</Badge>;
    case "reconciled":
      return <Badge>Conciliar</Badge>;
    case "ignored":
      return <Badge variant="outline">Ignorada</Badge>;
    case "imported":
      return <Badge variant="outline">Já importada</Badge>;
    default:
      return <Badge variant="outline">Novo</Badge>;
  }
};

const ReviewTable: React.FC<ReviewTableProps> = ({
  lines,
  categories,
  onPatchLine,
  onToggleAll,
  onOpenReconcile,
}) => {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return lines.filter((l) => {
      if (filter === "new" && l.match_status !== "new") return false;
      if (filter === "possible_duplicate" && l.match_status !== "possible_duplicate")
        return false;
      if (filter === "ignored" && l.match_status !== "ignored") return false;
      if (filter === "no_category" && l.category_id) return false;
      if (term && !l.description_raw.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [lines, filter, search]);

  const allSelected =
    visible.length > 0 && visible.every((l) => l.selected);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "new", label: "Novas" },
    { key: "possible_duplicate", label: "Possíveis duplicatas" },
    { key: "no_category", label: "Sem categoria" },
    { key: "ignored", label: "Ignoradas" },
  ];

  return (
    <Card className="p-3 sm:p-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar descrição"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(v) => onToggleAll(Boolean(v))}
        />
        <span className="text-sm text-muted-foreground">
          Selecionar todas as linhas visíveis ({visible.length})
        </span>
      </div>

      <div className="space-y-2">
        {visible.map((line) => {
          const options = categories.filter(
            (c) =>
              c.type === line.direction &&
              (c.entidades ?? [1]).includes(line.entidade)
          );
          const isDuplicate = line.match_status === "possible_duplicate";

          return (
            <div
              key={line.id}
              className={cn(
                "rounded-lg border p-3",
                isDuplicate ? "border-amber-300 bg-amber-50/50" : "border-border",
                line.match_status === "ignored" && "opacity-60"
              )}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex items-start gap-3 lg:w-[45%]">
                  <Checkbox
                    className="mt-1"
                    checked={line.selected}
                    onCheckedChange={(v) =>
                      onPatchLine(line.id, { selected: Boolean(v) })
                    }
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(line.posted_at)}
                      </span>
                      {statusBadge(line)}
                      {line.occurrence > 1 && (
                        <Badge variant="outline">
                          {line.occurrence}ª ocorrência
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 break-words text-sm font-medium">
                      {line.description_raw}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-bold",
                        line.direction === "income"
                          ? "text-emerald-600"
                          : "text-destructive"
                      )}
                    >
                      {line.direction === "income" ? "+" : "-"}
                      {formatBRL(Number(line.amount))}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    value={line.category_id ?? ""}
                    onValueChange={(v) =>
                      onPatchLine(line.id, { category_id: v })
                    }
                  >
                    <SelectTrigger className="sm:w-52">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(line.entidade)}
                    onValueChange={(v) =>
                      onPatchLine(line.id, {
                        entidade: Number(v),
                        category_id: null,
                      })
                    }
                  >
                    <SelectTrigger className="sm:w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Pessoal</SelectItem>
                      <SelectItem value="2">Empresarial</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    {isDuplicate && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onOpenReconcile(line)}
                      >
                        Comparar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        onPatchLine(line.id, {
                          match_status:
                            line.match_status === "ignored" ? "new" : "ignored",
                          selected: line.match_status === "ignored",
                        })
                      }
                    >
                      {line.match_status === "ignored" ? "Reativar" : "Ignorar"}
                    </Button>
                  </div>
                </div>
              </div>

              {line.selected && !line.category_id && line.match_status !== "ignored" && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Escolha uma categoria para importar esta linha.
                </p>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma linha para este filtro.
          </p>
        )}
      </div>
    </Card>
  );
};

export default ReviewTable;
