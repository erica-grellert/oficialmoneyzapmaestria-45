import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReferralDashboard from "@/components/referral/ReferralDashboard";

const ReferralPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppLayout showFAB={false}>
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 py-4 xs:py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-2 xs:gap-4 mb-4 xs:mb-6 sm:mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 min-h-[44px] touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline">Voltar</span>
          </Button>
        </div>

        {/* Referral Dashboard */}
        <ReferralDashboard />
      </div>
    </AppLayout>
  );
};

export default ReferralPage;
