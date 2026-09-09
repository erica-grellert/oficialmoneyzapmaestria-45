import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CircleSlash,
  Loader2,
  RefreshCw,
  Repeat,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePrefersReducedMotion } from "@/hooks/useAdminExperience";
import {
  listAdminSubscriptions,
  type AdminSubscription,
} from "@/lib/impersonation";
import { cn } from "@/lib/utils";

type SubscriptionFilter =
  | "all"
  | "active"
  | "non_renewing"
  | "canceled"
  | "past_due"
  | "trialing";

const FILTERS: Array<{ id: SubscriptionFilter; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "active", label: "Ativas" },
  { id: "non_renewing", label: "Sem renovação" },
  { id: "canceled", label: "Canceladas" },
  { id: "past_due", label: "Em atraso" },
  { id: "trialing", label: "Teste" },
];

const planLabel = (planType: string) => {
  switch (planType) {
    case "monthly":
      return "Mensal";
    case "annual":
      return "Anual";
    case "premium":
      return "Premium";
    default:
      return planType || "—";
  }
};

const statusLabel = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "Ativa";
    case "canceled":
    case "cancelled":
      return "Cancelada";
    case "past_due":
      return "Em atraso";
    case "unpaid":
      return "Não paga";
    case "trialing":
      return "Teste";
    case "incomplete":
      return "Incompleta";
    case "incomplete_expired":
      return "Incompleta expirada";
    default:
      return status;
  }
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
};

const isPeriodExpired = (subscription: AdminSubscription, now: number) =>
  !!subscription.current_period_end &&
  new Date(subscription.current_period_end).getTime() <= now;

const getSubscriptionFilter = (
  subscription: AdminSubscription,
  now: number
): SubscriptionFilter => {
  const status = subscription.status.toLowerCase();
  const expired = isPeriodExpired(subscription, now);

  if (status === "trialing") return "trialing";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled" || status === "cancelled") return "canceled";
  if (status === "active" && !subscription.cancel_at_period_end && !expired) {
    return "active";
  }
  return "non_renewing";
};

const statusBadgeVariant = (subscription: AdminSubscription, now: number) => {
  const filter = getSubscriptionFilter(subscription, now);
  if (filter === "active" || filter === "trialing") return "success" as const;
  if (filter === "past_due" || filter === "canceled") {
    return "destructive" as const;
  }
  return "outline" as const;
};

const AdminSubscriptionsManager: React.FC = () => {
  const { toast } = useToast();
  const reducedMotion = usePrefersReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SubscriptionFilter>("all");

  const loadSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await listAdminSubscriptions();
      setSubscriptions(list);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      toast({
        title: "Erro ao carregar assinaturas",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível listar as assinaturas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  const now = useMemo(() => Date.now(), [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    const term = query.trim().toLowerCase();

    return subscriptions.filter((subscription) => {
      if (
        filter !== "all" &&
        getSubscriptionFilter(subscription, now) !== filter
      ) {
        return false;
      }

      if (!term) return true;

      const name = subscription.user?.name?.toLowerCase() ?? "";
      const email = subscription.user?.email?.toLowerCase() ?? "";
      const phone = subscription.user?.phone ?? "";
      const stripeId = subscription.stripe_subscription_id?.toLowerCase() ?? "";
      const plan = planLabel(subscription.plan_type).toLowerCase();
      const status = statusLabel(subscription.status).toLowerCase();

      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        stripeId.includes(term) ||
        plan.includes(term) ||
        status.includes(term)
      );
    });
  }, [filter, now, query, subscriptions]);

  const counts = useMemo(() => {
    const next: Record<SubscriptionFilter, number> = {
      all: subscriptions.length,
      active: 0,
      non_renewing: 0,
      canceled: 0,
      past_due: 0,
      trialing: 0,
    };

    for (const subscription of subscriptions) {
      next[getSubscriptionFilter(subscription, now)] += 1;
    }

    return next;
  }, [now, subscriptions]);

  useEffect(() => {
    if (!listRef.current || isLoading || reducedMotion) return;
    const rows = listRef.current.querySelectorAll("[data-subscription-row]");
    if (!rows.length) return;
    gsap.fromTo(
      rows,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        stagger: 0.03,
        ease: "power2.out",
      }
    );
  }, [filteredSubscriptions, isLoading, reducedMotion]);

  return (
    <section className="space-y-5">
      <header className="admin-surface overflow-hidden p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="admin-kicker">Operações de cobrança</p>
            <h2 className="admin-display mt-2 text-3xl md:text-4xl">
              Assinaturas
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-[var(--admin-muted)] md:text-base">
              Todas as assinaturas da plataforma, com plano, status e data de
              renovação de cada conta.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="admin-gold-chip">
              <Repeat className="h-3.5 w-3.5" />
              {filteredSubscriptions.length} resultado
              {filteredSubscriptions.length === 1 ? "" : "s"}
            </div>
            <Button
              type="button"
              variant="outline"
              className="admin-button-ghost rounded-xl"
              onClick={() => void loadSubscriptions()}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
              />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <div className="admin-surface p-4 md:p-5">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, e-mail, plano ou ID do Stripe"
            className="h-11 rounded-xl border-[var(--admin-line-strong)] bg-white/80 pl-9"
            aria-label="Buscar assinaturas"
          />
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-[var(--admin-ink)] bg-[var(--admin-ink)] text-white"
                    : "border-[var(--admin-line)] bg-white/80 text-[var(--admin-muted)] hover:border-[var(--admin-line-strong)] hover:text-[var(--admin-ink)]"
                )}
              >
                {item.label}
                <span className="ml-1.5 opacity-70">{counts[item.id]}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-14 text-[var(--admin-muted)]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando assinaturas...
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="rounded-full border border-[var(--admin-line)] bg-white/70 p-3">
              <CircleSlash className="h-5 w-5 text-[var(--admin-muted)]" />
            </div>
            <p className="text-sm text-[var(--admin-muted)]">
              Nenhuma assinatura encontrada.
            </p>
          </div>
        ) : (
          <div ref={listRef} className="space-y-2.5">
            {filteredSubscriptions.map((subscription) => {
              const userLabel =
                subscription.user?.name ||
                subscription.user?.email ||
                "Usuário não encontrado";
              const expired = isPeriodExpired(subscription, now);

              return (
                <article
                  key={subscription.id}
                  data-subscription-row
                  className="admin-subscription-row"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-[var(--admin-ink)]">
                        {userLabel}
                      </p>
                      <Badge
                        variant="outline"
                        className="border-[var(--admin-line-strong)] bg-white/80"
                      >
                        {planLabel(subscription.plan_type)}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--admin-muted)] md:text-sm">
                      {subscription.user?.email || "Sem e-mail"}
                      {subscription.user?.phone
                        ? ` · ${subscription.user.phone}`
                        : ""}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--admin-muted)]">
                      {expired
                        ? "Venceu em"
                        : subscription.cancel_at_period_end
                          ? "Encerra em"
                          : "Renova em"}{" "}
                      {formatDate(subscription.current_period_end)}
                      {subscription.stripe_subscription_id
                        ? ` · ${subscription.stripe_subscription_id}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <Badge variant={statusBadgeVariant(subscription, now)}>
                      {statusLabel(subscription.status)}
                    </Badge>
                    {subscription.cancel_at_period_end && (
                      <Badge
                        variant="outline"
                        className="border-orange-200 text-[var(--admin-danger)]"
                      >
                        Sem renovação
                      </Badge>
                    )}
                    {expired &&
                      subscription.status.toLowerCase() === "active" && (
                        <Badge variant="destructive">Vencida</Badge>
                      )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminSubscriptionsManager;
