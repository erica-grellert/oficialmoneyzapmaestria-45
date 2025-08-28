import React from "react";
import { Button } from "@/components/ui/button";

import { Eye, EyeOff } from "lucide-react";
import UserProfileDropdown from "./UserProfileDropdown";
import { usePreferences } from "@/contexts/PreferencesContext";

interface DesktopHeaderProps {
  hideValues: boolean;
  toggleHideValues: () => void;
}

const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  hideValues,
  toggleHideValues,
}) => {
  const { t } = usePreferences();

  return (
    <div className="flex items-center justify-end gap-3 lg:gap-4 px-4 sm:px-6 lg:px-8 py-3 lg:py-4 bg-background/95 backdrop-blur-sm border-b flex-shrink-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleHideValues}
        className="flex items-center gap-2 h-9 px-3"
      >
        {hideValues ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        <span className="hidden sm:inline text-sm">
          {hideValues ? t("common.show") : t("common.hide")} {t("common.values")}
        </span>
      </Button>

      <UserProfileDropdown />
    </div>
  );
};

export default DesktopHeader;
