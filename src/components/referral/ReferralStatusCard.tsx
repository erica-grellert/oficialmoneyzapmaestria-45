import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Gift, Users, Share2, Copy, CheckCircle, Clock } from "lucide-react";
import {
  getCurrentUserReferralInfo,
  generateReferralLink,
  hasActiveReferralBonus,
  getReferralBonusExpiry,
  ReferralInfo,
} from "@/services/referralService";

interface ReferralStatusCardProps {
  className?: string;
  showFullStats?: boolean;
}

const ReferralStatusCard: React.FC<ReferralStatusCardProps> = ({
  className,
  showFullStats = false,
}) => {
  const { toast } = useToast();
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [hasBonus, setHasBonus] = useState(false);
  const [bonusExpiry, setBonusExpiry] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setIsLoading(true);

      const [info, hasActiveBonus, expiry] = await Promise.all([
        getCurrentUserReferralInfo(),
        hasActiveReferralBonus(),
        getReferralBonusExpiry(),
      ]);

      setReferralInfo(info);
      setHasBonus(hasActiveBonus);
      setBonusExpiry(expiry);
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReferralLink = async () => {
    if (!referralInfo?.referral_code) return;

    const referralLink = generateReferralLink(referralInfo.referral_code);

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description:
          "O link de indicação foi copiado para a área de transferência.",
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
        handleCopyReferralLink();
      }
    } else {
      handleCopyReferralLink();
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!referralInfo) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-primary" />
          Programa de Indicações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Seu código:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-100 rounded-md font-mono text-sm font-bold">
              {referralInfo.referral_code}
            </code>
            <Button
              onClick={handleCopyReferralLink}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              {copied ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            <Button
              onClick={handleShareReferralLink}
              size="sm"
              className="flex items-center gap-1"
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        {showFullStats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-lg font-bold text-gray-900">
                  {referralInfo.total_referrals}
                </span>
              </div>
              <p className="text-xs text-gray-600">Indicações</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Gift className="h-4 w-4 text-gray-600" />
                <span className="text-lg font-bold text-gray-900">
                  {referralInfo.referral_bonus_days}
                </span>
              </div>
              <p className="text-xs text-gray-600">Dias Bônus</p>
            </div>
          </div>
        )}

        {/* Active Bonus Status */}
        {hasBonus && bonusExpiry && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Clock className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                Bônus ativo até {bonusExpiry.toLocaleDateString("pt-BR")}
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Ativo
            </Badge>
          </div>
        )}

        {/* Quick Stats (compact view) */}
        {!showFullStats && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {referralInfo.total_referrals} indicações
            </span>
            <span className="text-gray-600">
              {referralInfo.referral_bonus_days} dias bônus
            </span>
          </div>
        )}

        {/* Call to Action */}
        <div className="pt-2">
          <p className="text-xs text-gray-600 mb-2">
            Indique amigos e ganhe 30 dias grátis para cada indicação!
          </p>
          <Button
            onClick={handleShareReferralLink}
            size="sm"
            className="w-full flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar Código
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralStatusCard;
