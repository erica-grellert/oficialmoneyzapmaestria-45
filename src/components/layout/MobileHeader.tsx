import React from "react";
import { Button } from "@/components/ui/button";

import { Eye, EyeOff } from "lucide-react";
import UserProfileDropdown from "./UserProfileDropdown";
import { usePreferences } from "@/contexts/PreferencesContext";

interface MobileHeaderProps {
  hideValues: boolean;
  toggleHideValues: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  hideValues,
  toggleHideValues,
}) => {
  const { t } = usePreferences();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end gap-2 px-4 py-3 bg-background/95 backdrop-blur-sm border-b md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleHideValues}
        aria-label={hideValues ? t("common.show") : t("common.hide")}
        className="h-9 w-9"
      >
        {hideValues ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>

      <UserProfileDropdown />
    </div>
  );
};

export default MobileHeader;
