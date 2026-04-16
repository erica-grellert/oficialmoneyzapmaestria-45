import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Gift,
  TrendingUp,
  Calendar,
  Search,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReferralStats {
  total_users: number;
  total_referrals: number;
  active_referrers: number;
  total_bonus_days_given: number;
  conversion_rate: number;
  top_referrers: Array<{
    id: string;
    name: string;
    email: string;
    referral_code: string;
    total_referrals: number;
    recent_referrals: number;
    bonus_days: number;
  }>;
  recent_referrals: Array<{
    id: string;
    name: string;
    email: string;
    referred_by: string;
    referrer_name: string;
    created_at: string;
  }>;
}

const ReferralAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("30"); // days

  useEffect(() => {
    loadReferralStats();
  }, [dateRange]);

  const loadReferralStats = async () => {
    try {
      setIsLoading(true);

      // Get total users
      const { count: totalUsers } = await supabase
        .from("moneyzap_users")
        .select("*", { count: "exact", head: true });

      // Get total referrals
      const { count: totalReferrals } = await supabase
        .from("moneyzap_users")
        .select("*", { count: "exact", head: true })
        .not("referred_by", "is", null);

      // Get active referrers (users who have referred others)
      const { count: activeReferrers } = await supabase
        .from("referral_stats")
        .select("*", { count: "exact", head: true })
        .gt("total_referrals", 0);

      // Get total bonus days given
      const { data: bonusData } = await supabase
        .from("moneyzap_users")
        .select("referral_bonus_days")
        .not("referral_bonus_days", "is", null);

      const totalBonusDays =
        bonusData?.reduce(
          (sum, user) => sum + (user.referral_bonus_days || 0),
          0
        ) || 0;

      // Get top referrers
      const { data: topReferrers } = await supabase
        .from("referral_stats")
        .select("*")
        .gt("total_referrals", 0)
        .order("total_referrals", { ascending: false })
        .limit(10);

      // Get recent referrals
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      const { data: recentReferrals } = await supabase
        .from("moneyzap_users")
        .select(
          `
          id,
          name,
          email,
          referred_by,
          created_at,
          referrer:referred_by(name, email)
        `
        )
        .not("referred_by", "is", null)
        .gte("created_at", daysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(50);

      const conversionRate = totalUsers
        ? (totalReferrals / totalUsers) * 100
        : 0;

      setStats({
        total_users: totalUsers || 0,
        total_referrals: totalReferrals || 0,
        active_referrers: activeReferrers || 0,
        total_bonus_days_given: totalBonusDays,
        conversion_rate: conversionRate,
        top_referrers: (topReferrers || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          referral_code: r.referral_code,
          total_referrals: r.total_referrals,
          recent_referrals: r.recent_referrals,
          bonus_days: r.referral_bonus_days || 0,
        })),
        recent_referrals:
          recentReferrals?.map((ref) => ({
            id: ref.id,
            name: ref.name || ref.email.split("@")[0],
            email: ref.email,
            referred_by: ref.referred_by,
            referrer_name:
              (ref.referrer as any)?.name ||
              (ref.referrer as any)?.email?.split("@")[0] ||
              "N/A",
            created_at: ref.created_at,
          })) || [],
      });
    } catch (error) {
      console.error("Error loading referral stats:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas de indicação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecentReferrals =
    stats?.recent_referrals.filter(
      (ref) =>
        ref.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.referrer_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Não foi possível carregar as estatísticas de indicação.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Analytics de Indicações
          </h2>
          <p className="text-gray-600 mt-1">
            Acompanhe o desempenho do programa de indicações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadReferralStats}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="dateRange">Período:</Label>
            <select
              id="dateRange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1 border rounded-md"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_users}
                </p>
                <p className="text-sm text-gray-600">Total de Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_referrals}
                </p>
                <p className="text-sm text-gray-600">Total de Indicações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top Indicadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.top_referrers.map((referrer, index) => (
              <div
                key={referrer.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{referrer.name}</p>
                    <p className="text-sm text-gray-600">{referrer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex justify-end items-end">
                    <Badge variant="secondary">
                      {referrer.total_referrals} indicações
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Código: {referrer.referral_code}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Indicações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRecentReferrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{referral.name}</p>
                  <p className="text-sm text-gray-600">{referral.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Indicado por: {referral.referrer_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(referral.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredRecentReferrals.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm
                  ? "Nenhuma indicação encontrada com os critérios de busca."
                  : "Nenhuma indicação recente."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralAnalytics;
