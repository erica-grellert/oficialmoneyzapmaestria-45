import React from "react";
import { useNavigate } from "react-router-dom";
import { EditIcon, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { usePreferences } from "@/contexts/PreferencesContext";

interface UserProfileDropdownProps {
  variant?: "default" | "ghost";
  size?: "default" | "sm" | "icon";
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  variant = "ghost",
  size = "icon",
}) => {
  const { user, logout } = useAdaptiveContext();
  const { t } = usePreferences();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  if (!user) {
    return null;
  }

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U";

  const displayName = user.name || user.email?.split("@")[0] || "Usuário";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profileImage} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick}>
          <EditIcon className="mr-2 h-4 w-4" />
          <span>{t("nav.profile") || "Perfil"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("settings.logout") || "Sair"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;
