import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Share2,
  Users,
  Calendar,
  Gift,
  ExternalLink,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  getCurrentUserReferralInfo,
  getReferredUsers,
  generateReferralLink,
  hasActiveReferralBonus,
  getReferralBonusExpiry,
  debugReferralDatabase,
  ReferralInfo,
} from "@/services/referralService";

interface ReferralDashboardProps {
  className?: string;
}

const ReferralDashboard: React.FC<ReferralDashboardProps> = ({ className }) => {
  const { toast } = useToast();
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [referredUsers, setReferredUsers] = useState<
    Array<{ id: string; name: string; email: string; created_at: string }>
  >([]);
  const [hasBonus, setHasBonus] = useState(false);
  const [bonusExpiry, setBonusExpiry] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadReferralData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [info, users, hasActiveBonus, expiry] = await Promise.all([
        getCurrentUserReferralInfo(),
        getReferredUsers(),
        hasActiveReferralBonus(),
        getReferralBonusExpiry(),
      ]);

      setReferralInfo(info);
      setReferredUsers(users);
      setHasBonus(hasActiveBonus);
      setBonusExpiry(expiry);
    } catch (error) {
      console.error("Error loading referral data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de indicação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  const handleCopyReferralLink = async () => {
    if (!referralInfo?.referral_code) return;

    const referralLink = generateReferralLink(referralInfo.referral_code);

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "Agora é só compartilhar!",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleShareReferralLink = async () => {
    if (!referralInfo?.referral_code) return;

    const referralLink = generateReferralLink(referralInfo.referral_code);
    const shareText = `🎉 Ganhe 30 dias grátis no Meu Controle IA! Use meu código de indicação: ${referralInfo.referral_code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Meu Controle IA - Código de Indicação",
          text: shareText,
          url: referralLink,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        // Fallback to copy
        handleCopyReferralLink();
      }
    } else {
      // Fallback to copy
      handleCopyReferralLink();
    }
  };

  const handleDebugDatabase = async () => {
    console.log("🔍 Running database debug...");
    await debugReferralDatabase();
    toast({
      title: "Debug executado",
      description: "Verifique o console do navegador para os resultados",
    });
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!referralInfo) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Não foi possível carregar as informações de indicação.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Programa de Indicações
        </h2>
        <p className="text-gray-600 mt-1">
          Indique amigos e ganhe 30 dias grátis para cada indicação!
        </p>
      </div>

      {/* Referral Code Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Seu Código de Indicação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor="referralCode">Código</Label>
              <Input
                id="referralCode"
                value={referralInfo.referral_code}
                readOnly
                className="font-mono text-lg font-bold"
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleCopyReferralLink}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
              <Button
                onClick={handleShareReferralLink}
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
              <Button
                onClick={handleDebugDatabase}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                🔍 Debug DB
              </Button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Como funciona:</strong> Compartilhe seu código com amigos.
              Quando eles se cadastrarem usando seu código, você ganha 30 dias
              grátis!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {referralInfo.total_referrals}
                </p>
                <p className="text-sm text-gray-600">Total de Indicações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {referralInfo.recent_referrals}
                </p>
                <p className="text-sm text-gray-600">Últimos 30 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {referralInfo.referral_bonus_days}
                </p>
                <p className="text-sm text-gray-600">Dias de Bônus</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Bonus Status */}
      {hasBonus && bonusExpiry && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">
                  🎉 Bônus de Indicação Ativo!
                </p>
                <p className="text-sm text-green-700">
                  Válido até {bonusExpiry.toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/*       
      {referredUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Pessoas que Você Indicou
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.name || user.email.split("@")[0]}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* {referredUsers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma indicação ainda
            </h3>
            <p className="text-gray-600 mb-4">
              Compartilhe seu código de indicação para começar a ganhar dias
              grátis!
            </p>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
};

export default ReferralDashboard;
